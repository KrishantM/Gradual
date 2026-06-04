/**
 * G.ai agent loop (streaming).
 *
 * Runs an OpenAI tool-calling conversation: the model reasons, optionally calls
 * registered tools, sees their results, and continues until it produces a final
 * answer or hits the hard iteration cap.
 *
 * `runAgentStream` is an async generator. It yields:
 *   - { type: 'token' }  — answer text deltas, streamed as the model produces
 *                          them, so the UI can render token-by-token.
 *   - { type: 'status' } — a transient label while a tool runs.
 *   - { type: 'result' } — exactly once, last: the complete run result.
 *
 * Cost & safety guards built in:
 * - MAX_ITERATIONS caps the number of OpenAI round-trips per user request.
 * - The final iteration disables tools so the model must produce an answer.
 * - In `confirm` autonomy, write tools are NOT executed — they are persisted as
 *   pending actions for the user to approve via /api/copilot/confirm.
 * - Read tools always execute (no side effects); only write tools are gated.
 * - Executed reversible writes are collected into a single 5-minute undo token.
 * - The model is chosen per-run by routeAgentModel (see models.ts) — simple
 *   turns use the fast model, multi-step turns use the frontier model.
 */

import OpenAI from 'openai';
import { openai } from '../../../../lib/openai';
import { db } from '../../../../lib/firebase-admin';
import { getTool, toolDefinitions, type GaiTool, type ToolRunContext } from './tools';
import { routeAgentModel } from './models';
import type { GaiAutonomy } from '../autonomy';
import type { CareerContext, CopilotSignals, GaiAction } from '@/types/copilot';

type Msg = OpenAI.Chat.Completions.ChatCompletionMessageParam;

const MAX_ITERATIONS = 5;
const UNDO_TTL_MS = 5 * 60 * 1000;
const PENDING_TTL_MS = 30 * 60 * 1000;

/**
 * Sentinel the model writes before its suggested follow-ups. Everything after it
 * is parsed into clickable chips and stripped from the visible answer. Chosen to
 * be vanishingly rare in career-advice prose so it never trips on real content.
 */
const FOLLOWUPS_MARKER = '\n[[FOLLOWUPS]]';
const MAX_FOLLOWUPS = 3;

/** Split a raw model answer into visible text and parsed follow-up prompts. */
function splitFollowUps(raw: string): { clean: string; followUps: string[] } {
  const idx = raw.indexOf(FOLLOWUPS_MARKER);
  if (idx === -1) return { clean: raw, followUps: [] };
  const followUps = raw
    .slice(idx + FOLLOWUPS_MARKER.length)
    .split('\n')
    .map((l) => l.replace(/^(?:[-*•]\s+|\d+[.)]\s+)/, '').trim())
    .filter(Boolean)
    .slice(0, MAX_FOLLOWUPS);
  return { clean: raw.slice(0, idx), followUps };
}

/**
 * How far into `content` it is safe to stream right now: never past the marker,
 * and holding back any trailing substring that could be the marker's start (so a
 * partial "[[FOLLOW…" never flashes before we know it's the sentinel).
 */
function safeStreamBoundary(content: string): number {
  const idx = content.indexOf(FOLLOWUPS_MARKER);
  if (idx !== -1) return idx;
  const maxHold = Math.min(FOLLOWUPS_MARKER.length - 1, content.length);
  for (let k = maxHold; k > 0; k--) {
    if (FOLLOWUPS_MARKER.startsWith(content.slice(content.length - k))) return content.length - k;
  }
  return content.length;
}

/** Transient status shown in the UI while a tool runs. */
const RUNNING_STATUS: Record<string, string> = {
  searchOpportunities: 'Searching opportunities…',
  addPlannerEvents: 'Updating your planner…',
  createTodos: 'Creating to-dos…',
  completeTodo: 'Marking that done…',
  saveOpportunity: 'Saving that opportunity…',
  enrollInPath: 'Setting up that path…',
};

export interface AgentRunResult {
  answer: string;
  executedActions: GaiAction[];
  proposedActions: GaiAction[];
  /** Suggested next-step prompts the user can tap to send as a follow-up. */
  followUps: string[];
  undoToken?: string;
  undoExpiresAt?: string;
  iterations: number;
}

/** Events emitted by runAgentStream as the run progresses. */
export type AgentEvent =
  | { type: 'token'; value: string }
  | { type: 'status'; value: string }
  | { type: 'result'; result: AgentRunResult };

export interface RunAgentArgs {
  uid: string;
  career: CareerContext;
  signals: CopilotSignals;
  /** Only 'full_auto' or 'confirm' reach here — 'manual' uses the legacy path. */
  autonomy: Exclude<GaiAutonomy, 'manual'>;
  history: { role: 'user' | 'assistant'; content: string }[];
  userMessage: string;
  todayISO: string;
  pathContext?: {
    pathId: string;
    pathTitle: string;
    moduleTitle?: string;
    currentConcept?: string;
  };
}

function buildSystemPrompt(args: RunAgentArgs): string {
  const ctxStr = JSON.stringify(args.career, null, 0).slice(0, 10000);
  const sigStr = JSON.stringify(args.signals, null, 0);
  const surface = args.pathContext
    ? `\nSURFACE CONTEXT — the user is messaging from inside a Gradual path:
- Path: "${args.pathContext.pathTitle}" (id: ${args.pathContext.pathId})
${args.pathContext.moduleTitle ? `- Current module: "${args.pathContext.moduleTitle}"` : ''}
${args.pathContext.currentConcept ? `- Module concept: ${args.pathContext.currentConcept.slice(0, 500)}` : ''}
Ground answers in this path/module when the question relates to it.\n`
    : '';

  const autonomyRules =
    args.autonomy === 'full_auto'
      ? `AUTONOMY: full_auto. When an action genuinely helps the user, CALL THE TOOL — it executes immediately and the user can undo it. Be decisive: if the user asks for a weekly plan, build it with addPlannerEvents rather than just describing it. Never take destructive or irreversible actions.`
      : `AUTONOMY: confirm. When you call a write tool it is QUEUED for the user's approval — it does NOT execute yet. Still call tools whenever an action would help; the user will confirm. Do not claim an action is done — say you have proposed it.`;

  // Static guidance first (prompt-cache friendly), per-run dynamic context last.
  return `You are G.ai, Gradual's agentic career assistant for students and early professionals. You are embedded in the Gradual app and can take real actions in the user's account through tools.

TOOL USE:
- Call searchOpportunities before recommending or saving a specific role, so you reference real listings with real ids.
- Use addPlannerEvents to schedule dated actions and createTodos for undated next steps.
- Only call a tool when it clearly serves the user's request. Do not call tools speculatively.
- Never invent that you took an action — only tool calls perform actions.

After any tool use, write a concise, friendly reply in markdown summarising what you did or proposed and the value of it. Keep it tight — short paragraphs, bullet lists where helpful. Refer to yourself as G.ai, never "Copilot".

FOLLOW-UPS: At the very end of your reply, suggest up to ${MAX_FOLLOWUPS} natural next steps the user is likely to want — but ONLY when they genuinely help (especially after open-ended or brainstorming answers). Format: a line containing exactly [[FOLLOWUPS]], then one follow-up per line, each phrased as a short first-person message the user could send back to you (e.g. "Schedule these steps in my planner", "Go deeper on the first idea"). No bullets or numbering. Omit the [[FOLLOWUPS]] block entirely when no follow-up adds value. Never mention this block or reference its formatting in your prose.

${autonomyRules}

Today is ${args.todayISO}.
${surface}
CAREER CONTEXT (JSON, truncated): ${ctxStr}

PRIORITY SIGNALS: ${sigStr}`;
}

/** Persist a write tool the user must approve. Returns the proposed-action card. */
async function persistProposed(uid: string, tool: GaiTool, data: unknown): Promise<GaiAction> {
  const ref = db.collection('users').doc(uid).collection('copilot_pending').doc();
  await ref.set({
    tool: tool.name,
    tier: tool.tier,
    data: data ?? {},
    label: tool.summarize(data),
    createdAt: new Date(),
  });
  return {
    id: ref.id,
    tool: tool.name,
    tier: tool.tier,
    label: tool.summarize(data),
    status: 'proposed',
  };
}

/**
 * Run the agent loop, streaming events as it goes. Never throws for tool
 * failures — those degrade to a best-effort answer. OpenAI/transport errors
 * propagate to the caller, which is expected to surface them.
 */
export async function* runAgentStream(args: RunAgentArgs): AsyncGenerator<AgentEvent, void, void> {
  const toolCtx: ToolRunContext = { uid: args.uid, career: args.career, todayISO: args.todayISO };
  const { model } = routeAgentModel({
    userMessage: args.userMessage,
    historyLength: args.history.length,
  });

  const messages: Msg[] = [
    { role: 'system', content: buildSystemPrompt(args) },
    ...args.history.map((h) => ({ role: h.role, content: h.content }) as Msg),
    { role: 'user', content: args.userMessage },
  ];

  const executed: GaiAction[] = [];
  const proposed: GaiAction[] = [];
  const undoRefs: string[] = [];
  let answer = '';
  let followUps: string[] = [];
  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations += 1;
    const lastIteration = iterations === MAX_ITERATIONS;

    const stream = await openai.chat.completions.create({
      model,
      messages,
      tools: toolDefinitions() as OpenAI.Chat.Completions.ChatCompletionTool[],
      tool_choice: lastIteration ? 'none' : 'auto',
      temperature: 0.4,
      max_tokens: 1500,
      stream: true,
    });

    let content = '';
    let emittedLen = 0; // chars of `content` already streamed to the client
    const toolAcc = new Map<number, { id: string; name: string; args: string }>();

    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      if (!choice) continue;
      const delta = choice.delta;
      if (delta?.content) {
        content += delta.content;
        // Stream only what's safely before the (possibly partial) follow-ups
        // marker, so the raw [[FOLLOWUPS]] block never flashes on screen.
        const boundary = safeStreamBoundary(content);
        if (boundary > emittedLen) {
          yield { type: 'token', value: content.slice(emittedLen, boundary) };
          emittedLen = boundary;
        }
      }
      for (const tc of delta?.tool_calls ?? []) {
        const cur = toolAcc.get(tc.index) ?? { id: '', name: '', args: '' };
        if (tc.id) cur.id = tc.id;
        if (tc.function?.name) cur.name += tc.function.name;
        if (tc.function?.arguments) cur.args += tc.function.arguments;
        toolAcc.set(tc.index, cur);
      }
    }

    // Split off the follow-ups block. If no marker turned up, flush any tail we
    // were holding back as a possible partial marker (it was a false alarm).
    const { clean, followUps: parsed } = splitFollowUps(content);
    if (parsed.length) followUps = parsed;
    if (clean.length > emittedLen) {
      yield { type: 'token', value: clean.slice(emittedLen) };
      emittedLen = clean.length;
    }

    // Whatever text the model produced this iteration is part of the answer
    // (final-answer text, or rare preamble before a tool call). It was already
    // streamed token-by-token above.
    answer += clean;

    const toolCalls = [...toolAcc.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v);
    if (toolCalls.length === 0) break;

    // Record the assistant turn (with its tool_calls) before answering them.
    const assistantMsg: OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam = {
      role: 'assistant',
      content: clean || null,
      tool_calls: toolCalls.map((t) => ({
        id: t.id,
        type: 'function' as const,
        function: { name: t.name, arguments: t.args },
      })),
    };
    messages.push(assistantMsg);

    for (const call of toolCalls) {
      const tool = getTool(call.name);
      let resultText: string;

      if (!tool) {
        resultText = `Error: unknown tool "${call.name}".`;
      } else {
        yield { type: 'status', value: RUNNING_STATUS[tool.name] ?? 'Working on it…' };

        let parsedArgs: unknown = {};
        try {
          parsedArgs = JSON.parse(call.args || '{}');
        } catch {
          parsedArgs = {};
        }
        const validation = tool.validate(parsedArgs);

        if (!validation.ok) {
          resultText = `Error: invalid arguments for ${tool.name} — ${validation.error}`;
        } else if (tool.tier !== 'read' && args.autonomy === 'confirm') {
          // confirm mode — queue the write instead of running it.
          const action = await persistProposed(args.uid, tool, validation.data);
          proposed.push(action);
          resultText = `Proposed "${action.label}". This is queued for the user to confirm — it has NOT executed.`;
        } else {
          // read tools, and all writes under full_auto — execute now.
          try {
            const res = await tool.execute(toolCtx, validation.data);
            if (tool.tier !== 'read') {
              executed.push({
                id: crypto.randomUUID(),
                tool: tool.name,
                tier: tool.tier,
                label: tool.summarize(validation.data),
                status: res.ok ? 'executed' : 'failed',
                detail: res.detail,
              });
            }
            if (res.undoRefs?.length) undoRefs.push(...res.undoRefs);
            resultText = res.detail;
          } catch (e) {
            console.error(`[runAgentStream] tool ${tool.name} failed`, e);
            executed.push({
              id: crypto.randomUUID(),
              tool: tool.name,
              tier: tool.tier,
              label: tool.summarize(validation.data),
              status: 'failed',
              detail: 'This action could not be completed.',
            });
            resultText = `Error: ${tool.name} failed to execute.`;
          }
        }
      }

      messages.push({ role: 'tool', tool_call_id: call.id, content: resultText });
    }
  }

  if (!answer.trim()) {
    answer =
      executed.length > 0 || proposed.length > 0
        ? 'Done — see the actions below.'
        : "I wasn't able to generate a reply just now. Please try rephrasing.";
    // This fallback was not streamed token-by-token — emit it so the live UI
    // still shows something.
    yield { type: 'token', value: answer };
  }

  // Bundle reversible writes into one undo token.
  let undoToken: string | undefined;
  let undoExpiresAt: string | undefined;
  if (undoRefs.length > 0) {
    undoToken = crypto.randomUUID();
    undoExpiresAt = new Date(Date.now() + UNDO_TTL_MS).toISOString();
    try {
      await db
        .collection('users')
        .doc(args.uid)
        .collection('copilot_undo')
        .doc(undoToken)
        .set({ refs: undoRefs, createdAt: new Date() });
    } catch (e) {
      console.error('[runAgentStream] failed to persist undo token', e);
      undoToken = undefined;
      undoExpiresAt = undefined;
    }
  }

  yield {
    type: 'result',
    result: {
      answer,
      executedActions: executed,
      proposedActions: proposed,
      followUps,
      undoToken,
      undoExpiresAt,
      iterations,
    },
  };
}

export { PENDING_TTL_MS };

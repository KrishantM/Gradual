/**
 * POST /api/copilot/chat
 *
 * G.ai chat endpoint. Streams its reply as newline-delimited JSON (NDJSON) so
 * the UI can render token-by-token. See src/lib/copilot/chat-stream.ts for the
 * event protocol.
 *
 * Behaviour depends on the user's autonomy level (users/{uid}.gaiAutonomy):
 * - manual            — suggestion-only. Builds a structured JSON response and,
 *                       in assist mode, auto-creates the top todos (legacy
 *                       path). The answer is generated buffered, then emitted
 *                       as a single token event so the client has one code path.
 * - full_auto/confirm — runs the agentic tool loop (see run-agent.ts), which
 *                       streams answer tokens and tool-status events. full_auto
 *                       executes actions; confirm queues them for approval.
 *
 * Rate limiting + the daily AI budget are enforced (before streaming begins)
 * via the Firestore-backed limiter in rate-limit.ts. A blocked request returns
 * a normal 429 JSON response, not a stream.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth, db } from '@/lib/firebase-admin';
import { openai } from '@/lib/openai';
import { getCareerContext } from '@/lib/copilot/get-career-context';
import { evaluateSignals } from '@/lib/copilot/evaluate-signals';
import { checkAndConsume } from '@/lib/copilot/rate-limit';
import { normalizeAutonomy, isAgentic } from '@/lib/copilot/autonomy';
import { runAgentStream, type AgentRunResult } from '@/lib/copilot/agent/run-agent';
import { GAI_MODELS } from '@/lib/copilot/agent/models';
import type { CareerContext, CopilotChatResponse, CopilotSignals } from '@/types/copilot';

export const maxDuration = 60;

const BodySchema = z.object({
  message: z.string().max(4000).transform((s) => s.trim().slice(0, 4000)),
  mode: z.enum(['suggest', 'assist']),
  // User's local date — lets the agent schedule planner events correctly.
  clientDateISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  // Optional surface-aware context. The Paths-side G.ai pane sets this so the
  // model can ground its answer in the path/module the user is currently on.
  pathContext: z
    .object({
      pathId: z.string().max(80),
      pathTitle: z.string().max(200),
      moduleId: z.string().max(80).optional(),
      moduleTitle: z.string().max(200).optional(),
      currentConcept: z.string().max(800).optional(),
    })
    .optional(),
});

const UNDO_TTL_MS = 5 * 60 * 1000;
const ASSIST_TOP_TODOS = 3;
const MAX_CONVERSATION_MESSAGES = 20;

/** Remove undefined from nested values so Firestore accepts the payload */
function stripUndefined<T>(value: T): T {
  if (value === undefined) return value;
  if (Array.isArray(value)) return value.map(stripUndefined) as T;
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (v !== undefined) out[k] = stripUndefined(v);
    }
    return out as T;
  }
  return value;
}

function getThisWeekDateKeys(): string[] {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(mon);
    x.setDate(mon.getDate() + i);
    return x.toISOString().slice(0, 10);
  });
}

interface PathSurfaceContext {
  pathId: string;
  pathTitle: string;
  moduleId?: string;
  moduleTitle?: string;
  currentConcept?: string;
}

function buildPrompt(
  context: unknown,
  signals: CopilotSignals,
  conversationHistory: { role: string; content: string }[],
  userMessage: string,
  pathContext?: PathSurfaceContext
): string {
  const ctxStr = JSON.stringify(context, null, 0).slice(0, 12000);
  const sigStr = JSON.stringify(signals, null, 0);
  const historyStr =
    conversationHistory.length > 0
      ? `Previous conversation:\n${conversationHistory.map((m) => `${m.role}: ${m.content}`).join('\n')}\n\n`
      : '';
  const weekKeys = getThisWeekDateKeys();
  const weekKeysStr = weekKeys.join(', ');
  const pathContextBlock = pathContext
    ? `\nSURFACE CONTEXT (the user is messaging from inside Paths):
- Path: "${pathContext.pathTitle}" (id: ${pathContext.pathId})
${pathContext.moduleTitle ? `- Currently viewing module: "${pathContext.moduleTitle}" (id: ${pathContext.moduleId ?? 'unknown'})` : ''}
${pathContext.currentConcept ? `- Module concept: ${pathContext.currentConcept.slice(0, 600)}` : ''}
Tailor your answer to this path/module when the user's question is about the lesson, a concept they are stuck on, applying the practical action, or planning around it. When they ask something unrelated to the path, ignore this context.\n`
    : '';
  return `You are G.ai: Gradual's career AI. You are a strategic career coach embedded in the Gradual app. You give concise, actionable advice. You NEVER add jobs to the user's tracker, rewrite CVs, or do reflection loops. You CAN suggest to-dos and recommend Gradual Consulting when it fits. When you refer to yourself in replies, call yourself G.ai — never use "Copilot".

If the user has active capability paths (see context.activePaths), reference them when relevant — celebrate progress, suggest pairing today's action with their current module, and avoid recommending paths they are already on. Do NOT spam the user about paths in unrelated questions.
${pathContextBlock}
Career context (JSON, truncated): ${ctxStr}

Priority signals and consulting flags (use these to focus your answer): ${sigStr}

${historyStr}New user message: ${userMessage.replace(/\n/g, ' ').slice(0, 2000)}

Respond with a single JSON object only, no other text.

DYNAMIC STRUCTURE: Include ONLY sections that are directly relevant to the user's question. Do NOT add priorities, suggestedTodos, suggestedOpportunities, or consultingRecommendation just to fill the object—use [] or null when that section is not relevant. For example: a simple "what should I focus on?" might only need answer + priorities; a "weekly plan" request needs answer + weeklyPlan (see below).

{
  "answer": "string (ALWAYS include; 2-4 short paragraphs when substantive, markdown OK)",
  "priorities": [{"title":"string","rationale":"string"}] or [] if not relevant,
  "suggestedTodos": [{"title":"string","notes":"string (optional)","priority":"low|medium|high","dueDateISO":"ISO date or null"}] or [] if not relevant,
  "suggestedOpportunities": [{"jobId":"string","title":"string","company":"string","location":"string","url":"string","whyFit":"string"}] or [] if not relevant,
  "consultingRecommendation": {"recommended":boolean,"reason":"string","ctaText":"string"} or null if not relevant,
  "weeklyPlan": only when the user asks for a weekly plan or schedule. Object with keys as YYYY-MM-DD and values as arrays of {"title":"string","notes":"string (optional)"} for tasks that day. Omit entirely or use {} when not a weekly-plan request.
}

For weekly plan requests only: set weeklyPlan to an object with exactly these 7 keys (this week Mon-Sun): ${weekKeysStr}. Use each date key with an array of 1-4 concrete tasks for that day (each task: title string, optional notes string). Limit when included: up to 5 priorities, up to 5 suggestedTodos, up to 3 suggestedOpportunities. Use jobId/title/company/location/url from context.opportunities when suggesting opportunities. For follow-up or refinement questions, build on the previous conversation.`;
}

function parseLLMJson(content: string): Partial<CopilotChatResponse> {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { answer: content || 'I could not generate a structured response.', priorities: [], suggestedTodos: [], suggestedOpportunities: [] };
  }
  try {
    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    return {
      answer: String(parsed.answer ?? ''),
      priorities: Array.isArray(parsed.priorities)
        ? (parsed.priorities as { title?: string; rationale?: string }[]).map((p) => ({ title: String(p?.title ?? ''), rationale: String(p?.rationale ?? '') }))
        : [],
      suggestedTodos: Array.isArray(parsed.suggestedTodos)
        ? (parsed.suggestedTodos as { title?: string; notes?: string; priority?: string; dueDateISO?: string }[]).map((t) => ({
            title: String(t?.title ?? ''),
            notes: t?.notes,
            priority: String(t?.priority ?? 'medium'),
            dueDateISO: t?.dueDateISO ?? undefined,
          }))
        : [],
      suggestedOpportunities: Array.isArray(parsed.suggestedOpportunities)
        ? (parsed.suggestedOpportunities as { jobId?: string; title?: string; company?: string; location?: string; url?: string; whyFit?: string }[]).map((o) => ({
            jobId: String(o?.jobId ?? ''),
            title: String(o?.title ?? ''),
            company: String(o?.company ?? ''),
            location: String(o?.location ?? ''),
            url: String(o?.url ?? ''),
            whyFit: String(o?.whyFit ?? ''),
          }))
        : [],
      consultingRecommendation:
        parsed.consultingRecommendation && typeof parsed.consultingRecommendation === 'object'
          ? {
              recommended: Boolean((parsed.consultingRecommendation as Record<string, unknown>).recommended),
              reason: String((parsed.consultingRecommendation as Record<string, unknown>).reason ?? ''),
              ctaText: String((parsed.consultingRecommendation as Record<string, unknown>).ctaText ?? 'Book a free 10-min fit check'),
            }
          : undefined,
      weeklyPlan:
        parsed.weeklyPlan && typeof parsed.weeklyPlan === 'object' && !Array.isArray(parsed.weeklyPlan)
          ? (Object.fromEntries(
              Object.entries(parsed.weeklyPlan as Record<string, unknown>).filter(
                ([_, v]) => Array.isArray(v)
              ).map(([k, v]) => [
                k,
                (v as { title?: string; notes?: string }[]).map((t) => ({
                  title: String(t?.title ?? ''),
                  notes: t?.notes != null ? String(t.notes) : undefined,
                })),
              ])
            ) as Record<string, { title: string; notes?: string }[]>)
          : undefined,
    };
  } catch {
    return { answer: content || 'I could not parse the response.', priorities: [], suggestedTodos: [], suggestedOpportunities: [] };
  }
}

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  let uid: string;
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await auth.verifyIdToken(authHeader.slice(7));
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Rate limit + daily AI budget (Firestore-backed, shared) ───────────────
  const limit = await checkAndConsume(uid);
  if (!limit.ok) {
    return NextResponse.json(
      { error: limit.message, reason: limit.reason, retryAfterMs: limit.retryAfterMs },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(limit.retryAfterMs / 1000)) } }
    );
  }

  // ── Body ──────────────────────────────────────────────────────────────────
  let parseResult;
  try {
    parseResult = BodySchema.safeParse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
  if (!parseResult.success) {
    return NextResponse.json({ error: 'Invalid body', details: parseResult.error.flatten() }, { status: 400 });
  }
  const { message: userMessage, mode, pathContext, clientDateISO } = parseResult.data;
  if (!userMessage) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  // ── Context + conversation history (awaited before streaming, so a failure
  //    here is a normal 500 rather than a half-open stream) ──────────────────
  let context: CareerContext;
  let signals: CopilotSignals;
  let autonomy: ReturnType<typeof normalizeAutonomy>;
  let currentRef: ReturnType<ReturnType<typeof db.collection>['doc']>;
  let messages: { role: string; content: string }[];
  try {
    context = await getCareerContext(uid);
    signals = evaluateSignals(context);
    autonomy = normalizeAutonomy((context.profile as Record<string, unknown> | null)?.gaiAutonomy);
    currentRef = db.collection('users').doc(uid).collection('copilot_state').doc('current');
    const currentSnap = await currentRef.get();
    const existingMessages =
      (currentSnap.exists ? (currentSnap.data()?.messages as { role: string; content: string }[]) : null) ?? [];
    messages = [...existingMessages, { role: 'user' as const, content: userMessage }].slice(-MAX_CONVERSATION_MESSAGES);
  } catch (e) {
    console.error('[POST /api/copilot/chat] context load failed', e);
    return NextResponse.json({ error: 'Failed to load your career context' }, { status: 500 });
  }

  const todayISO = clientDateISO ?? new Date().toISOString().slice(0, 10);
  const encoder = new TextEncoder();

  // ── Stream the reply as NDJSON ────────────────────────────────────────────
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (obj: unknown) => controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));

      try {
        let response: CopilotChatResponse;
        let assistantContent: string;

        if (isAgentic(autonomy)) {
          // ── Agentic path — streaming tool-calling loop ───────────────────
          const history = messages
            .slice(0, -1)
            .filter((m): m is { role: 'user' | 'assistant'; content: string } =>
              m.role === 'user' || m.role === 'assistant'
            );
          let result: AgentRunResult | null = null;
          for await (const ev of runAgentStream({
            uid,
            career: context,
            signals,
            autonomy,
            history,
            userMessage,
            todayISO,
            pathContext,
          })) {
            if (ev.type === 'token') emit({ t: 'token', v: ev.value });
            else if (ev.type === 'status') emit({ t: 'status', v: ev.value });
            else result = ev.result;
          }
          if (!result) throw new Error('agent produced no result');
          assistantContent = result.answer;
          response = {
            answer: result.answer,
            priorities: [],
            suggestedTodos: [],
            suggestedOpportunities: [],
            executedActions: result.executedActions,
            proposedActions: result.proposedActions,
            followUps: result.followUps,
            autonomy,
            undoToken: result.undoToken,
            undoExpiresAt: result.undoExpiresAt,
          };
        } else {
          // ── Manual path — suggestion-only (legacy). Generated buffered,
          //    then emitted as one token event for a uniform client. ────────
          const prompt = buildPrompt(context, signals, messages.slice(0, -1), userMessage, pathContext);
          const completion = await openai.chat.completions.create({
            model: GAI_MODELS.primary,
            messages: [
              { role: 'system', content: 'You output only valid JSON in the exact shape requested. No commentary before or after.' },
              { role: 'user', content: prompt },
            ],
            temperature: 0.4,
            max_tokens: 2000,
          });
          const parsed = parseLLMJson(completion.choices[0]?.message?.content ?? '');
          assistantContent = parsed.answer ?? 'No reply generated.';
          response = {
            answer: assistantContent,
            priorities: parsed.priorities ?? [],
            suggestedTodos: parsed.suggestedTodos ?? [],
            suggestedOpportunities: parsed.suggestedOpportunities ?? [],
            consultingRecommendation: parsed.consultingRecommendation,
            weeklyPlan: parsed.weeklyPlan,
            autonomy,
          };
          emit({ t: 'token', v: assistantContent });

          // Assist mode — auto-create the top suggested todos with an undo window.
          if (mode === 'assist' && (parsed.suggestedTodos?.length ?? 0) > 0) {
            const toCreate = (parsed.suggestedTodos ?? []).slice(0, ASSIST_TOP_TODOS);
            const createdIds: string[] = [];
            for (const t of toCreate) {
              const text = (t.notes?.trim() ? `${t.title}\n${t.notes.trim()}` : t.title).slice(0, 2000);
              const ref = await db.collection('todos').add({ userId: uid, text, timestamp: new Date() });
              createdIds.push(ref.id);
            }
            if (createdIds.length > 0) {
              const undoToken = crypto.randomUUID();
              response.undoToken = undoToken;
              response.undoExpiresAt = new Date(Date.now() + UNDO_TTL_MS).toISOString();
              await db.collection('users').doc(uid).collection('copilot_undo').doc(undoToken).set({
                todoIds: createdIds,
                collection: 'todos',
                createdAt: new Date(),
              });
            }
          }
        }

        // Structured payload — sent once, after the answer text.
        emit({ t: 'meta', response });

        // ── Persist conversation, session summary, latest snapshot. A failure
        //    here must not blank the answer the user already has. ────────────
        try {
          const updatedMessages = [...messages, { role: 'assistant' as const, content: assistantContent }].slice(
            -MAX_CONVERSATION_MESSAGES
          );
          await currentRef.set({ messages: updatedMessages, updatedAt: new Date() });

          await db.collection('users').doc(uid).collection('copilot_sessions').doc().set({
            createdAt: new Date(),
            userMessage: userMessage.slice(0, 2000),
            assistantSummary: assistantContent.slice(0, 500),
            priorities: (response.priorities ?? []).map((p) => p.title),
            todosSuggested: response.suggestedTodos?.length ?? 0,
            autonomy,
            actionsExecuted: response.executedActions?.length ?? 0,
          });

          await db.collection('users').doc(uid).collection('copilot_state').doc('latest').set(
            stripUndefined({
              answer: response.answer,
              priorities: response.priorities,
              suggestedTodos: response.suggestedTodos,
              suggestedOpportunities: response.suggestedOpportunities,
              consultingRecommendation: response.consultingRecommendation ?? null,
              weeklyPlan: response.weeklyPlan ?? null,
              executedActions: response.executedActions ?? null,
              proposedActions: response.proposedActions ?? null,
              autonomy,
              userMessage: userMessage.slice(0, 2000),
              createdAt: new Date(),
            })
          );
        } catch (e) {
          console.error('[POST /api/copilot/chat] persistence failed', e);
        }

        emit({ t: 'done' });
      } catch (e) {
        console.error('[POST /api/copilot/chat]', e);
        emit({ t: 'error', v: 'Failed to run G.ai' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}

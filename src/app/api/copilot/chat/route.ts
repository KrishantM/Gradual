/**
 * POST /api/copilot/chat
 * Copilot chat/plan endpoint: context + signals + LLM, optional todo creation in assist mode.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth, db } from '@/lib/firebase-admin';
import { openai } from '@/lib/openai';
import { getCareerContext } from '@/lib/copilot/get-career-context';
import { evaluateSignals } from '@/lib/copilot/evaluate-signals';
import type { CopilotChatResponse, CopilotSignals } from '@/types/copilot';

const BodySchema = z.object({
  message: z.string().max(4000).transform((s) => s.trim().slice(0, 4000)),
  mode: z.enum(['suggest', 'assist']),
});

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const UNDO_TTL_MS = 5 * 60 * 1000;
const ASSIST_TOP_TODOS = 3;

const rateMap = new Map<string, { count: number; resetAt: number }>();

function rateLimit(uid: string): boolean {
  const now = Date.now();
  let entry = rateMap.get(uid);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateMap.set(uid, entry);
  }
  entry.count += 1;
  return entry.count <= RATE_LIMIT_MAX;
}

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

function buildPrompt(
  context: unknown,
  signals: CopilotSignals,
  conversationHistory: { role: string; content: string }[],
  userMessage: string
): string {
  const ctxStr = JSON.stringify(context, null, 0).slice(0, 12000);
  const sigStr = JSON.stringify(signals, null, 0);
  const historyStr =
    conversationHistory.length > 0
      ? `Previous conversation:\n${conversationHistory.map((m) => `${m.role}: ${m.content}`).join('\n')}\n\n`
      : '';
  const weekKeys = getThisWeekDateKeys();
  const weekKeysStr = weekKeys.join(', ');
  return `You are Gradual Copilot: a strategic career coach inside the Gradual app. You give concise, actionable advice. You NEVER add jobs to the user's tracker, rewrite CVs, or do reflection loops. You CAN suggest to-dos and recommend Gradual Consulting when it fits.

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
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await auth.verifyIdToken(token);
    const uid = decoded.uid;

    if (!rateLimit(uid)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const raw = await req.json();
    const parseResult = BodySchema.safeParse(raw);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid body', details: parseResult.error.flatten() }, { status: 400 });
    }
    const { message: userMessage, mode } = parseResult.data;
    if (!userMessage) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const context = await getCareerContext(uid);
    const signals = evaluateSignals(context);

    const currentRef = db.collection('users').doc(uid).collection('copilot_state').doc('current');
    const currentSnap = await currentRef.get();
    const existingMessages = (currentSnap.exists ? (currentSnap.data()?.messages as { role: string; content: string }[]) : null) ?? [];
    const messages = [...existingMessages, { role: 'user' as const, content: userMessage }].slice(-MAX_CONVERSATION_MESSAGES);

    const prompt = buildPrompt(context, signals, messages.slice(0, -1), userMessage);
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You output only valid JSON in the exact shape requested. No commentary before or after.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 2000,
    });
    const content = completion.choices[0]?.message?.content ?? '';
    const parsed = parseLLMJson(content);

    const priorities = parsed.priorities ?? [];
    const suggestedTodos = parsed.suggestedTodos ?? [];
    const assistantSummary = (parsed.answer ?? '').slice(0, 500);

    const assistantContent = parsed.answer ?? 'No reply generated.';
    const updatedMessages = [...messages, { role: 'assistant' as const, content: assistantContent }].slice(-MAX_CONVERSATION_MESSAGES);
    await currentRef.set({
      messages: updatedMessages,
      updatedAt: new Date(),
    });

    const sessionRef = db.collection('users').doc(uid).collection('copilot_sessions').doc();
    await sessionRef.set({
      createdAt: new Date(),
      userMessage: userMessage.slice(0, 2000),
      assistantSummary,
      priorities: priorities.map((p) => p.title),
      todosSuggested: suggestedTodos.length,
    });

    const response: CopilotChatResponse = {
      answer: assistantContent,
      priorities,
      suggestedTodos,
      suggestedOpportunities: parsed.suggestedOpportunities ?? [],
      consultingRecommendation: parsed.consultingRecommendation,
      weeklyPlan: parsed.weeklyPlan,
    };

    let undoToken: string | undefined;
    let undoExpiresAt: string | undefined;
    if (mode === 'assist' && suggestedTodos.length > 0) {
      const toCreate = suggestedTodos.slice(0, ASSIST_TOP_TODOS);
      const createdIds: string[] = [];
      for (const t of toCreate) {
        const text = (t.notes?.trim() ? `${t.title}\n${t.notes.trim()}` : t.title).slice(0, 2000);
        const ref = await db.collection('todos').add({
          userId: uid,
          text,
          timestamp: new Date(),
        });
        createdIds.push(ref.id);
      }
      if (createdIds.length > 0) {
        undoToken = crypto.randomUUID();
        undoExpiresAt = new Date(Date.now() + UNDO_TTL_MS).toISOString();
        await db.collection('users').doc(uid).collection('copilot_undo').doc(undoToken).set({
          todoIds: createdIds,
          collection: 'todos',
          createdAt: new Date(),
        });
      }
      response.undoToken = undoToken;
      response.undoExpiresAt = undoExpiresAt;
    }

    await db.collection('users').doc(uid).collection('copilot_state').doc('latest').set(
      stripUndefined({
        answer: response.answer,
        priorities: response.priorities,
        suggestedTodos: response.suggestedTodos,
        suggestedOpportunities: response.suggestedOpportunities,
        consultingRecommendation: response.consultingRecommendation ?? null,
        weeklyPlan: response.weeklyPlan ?? null,
        userMessage: userMessage.slice(0, 2000),
        createdAt: new Date(),
      })
    );

    return NextResponse.json(response);
  } catch (e) {
    console.error('[POST /api/copilot/chat]', e);
    return NextResponse.json({ error: 'Failed to run copilot' }, { status: 500 });
  }
}

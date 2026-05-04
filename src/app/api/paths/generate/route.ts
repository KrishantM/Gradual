/**
 * POST /api/paths/generate
 *
 * Generates a personalised career pathway from a user-supplied goal.
 * Returns 5 horizons (now, 30 days, 3 months, 6 months, 12 months), each
 * with concrete steps across skills, projects, learning, experience, and
 * opportunity types.
 *
 * Body: { goal: string, targetRole?: string, targetIndustry?: string }
 * Persists the pathway at users/{uid}/generated_pathways/{id}.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth, db } from '@/lib/firebase-admin';
import { openai } from '@/lib/openai';
import { getCareerContext } from '@/lib/copilot/get-career-context';
import {
  HORIZON_ORDER,
  type GeneratedPathway,
  type HorizonKey,
  type PathwayHorizon,
  type PathwayStep,
} from '@/lib/paths/pathway-types';

const BodySchema = z.object({
  goal: z.string().min(3).max(500).transform((s) => s.trim()),
  targetRole: z.string().max(120).optional(),
  targetIndustry: z.string().max(120).optional(),
});

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 8;
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

const VALID_KINDS = new Set(['skill', 'project', 'learning', 'experience', 'opportunity']);

function buildPrompt(args: {
  goal: string;
  targetRole?: string;
  targetIndustry?: string;
  contextSummary: string;
}): string {
  const { goal, targetRole, targetIndustry, contextSummary } = args;
  return `You are Gradual's career pathway architect. A student/early-career user has set a goal. Design a personalised, realistic 12-month roadmap broken into 5 horizons.

Goal: ${goal}
${targetRole ? `Target role: ${targetRole}` : ''}
${targetIndustry ? `Target industry: ${targetIndustry}` : ''}

User's current career context (compact JSON, may be partial): ${contextSummary}

Design rules:
- 5 horizons, in this exact order: now, 30d, 3mo, 6mo, 12mo.
- Each horizon must have 3–5 steps. Steps escalate in ambition over time.
- Each step has kind ∈ {skill, project, learning, experience, opportunity}. Mix kinds across the horizon — don't make every step the same kind.
- "skill" = a specific capability to build (not a course). e.g. "Master SQL window functions".
- "project" = a deliverable the user will produce. e.g. "Ship a 3-page case study on a public company".
- "learning" = focused study, course, book, or guided practice.
- "experience" = a real-world step like an internship, society role, freelance gig, or hackathon.
- "opportunity" = a category of role/internship/event the user should be applying to at this horizon. Suggestions should be concrete categories (e.g. "Spring weeks at MBB", "Climate tech grad schemes") not specific job titles.
- Use the user's profile (interests, university, CV) to make the plan feel personal, but don't reference data you don't have.
- "now" steps should be doable this week. "12mo" steps should describe the proof of arrival.
- Avoid fluff. Each rationale is 1–2 sentences explaining why this step right now.

Title rules:
- Title must be a strong, motivating phrase, max 60 chars. e.g. "Path to Product Manager" or "From CS student to AI Research Engineer".
- Summary is 1–3 sentences. Plain language, no buzzwords.

Output a single JSON object only, no commentary:

{
  "title": "string",
  "summary": "string",
  "horizons": [
    {
      "key": "now" | "30d" | "3mo" | "6mo" | "12mo",
      "outcome": "string (1 line, concrete result of this horizon)",
      "steps": [
        {
          "title": "string",
          "rationale": "string",
          "kind": "skill" | "project" | "learning" | "experience" | "opportunity",
          "suggestions": ["string", ...] (optional, 0-4 items)
        }
      ]
    }
  ]
}`;
}

interface RawHorizon {
  key?: string;
  outcome?: string;
  steps?: Array<{
    title?: string;
    rationale?: string;
    kind?: string;
    suggestions?: unknown[];
  }>;
}

interface RawPathway {
  title?: string;
  summary?: string;
  horizons?: RawHorizon[];
}

function normalisePathway(raw: RawPathway, fallbackTitle: string): {
  title: string;
  summary: string;
  horizons: PathwayHorizon[];
} {
  const title = String(raw.title ?? fallbackTitle).slice(0, 80);
  const summary = String(raw.summary ?? '').slice(0, 600);

  const byKey = new Map<HorizonKey, RawHorizon>();
  if (Array.isArray(raw.horizons)) {
    for (const h of raw.horizons) {
      const k = String(h?.key ?? '') as HorizonKey;
      if (HORIZON_ORDER.includes(k)) byKey.set(k, h);
    }
  }

  const horizons: PathwayHorizon[] = HORIZON_ORDER.map((key) => {
    const raw = byKey.get(key);
    const stepsRaw = Array.isArray(raw?.steps) ? raw!.steps : [];
    const steps: PathwayStep[] = stepsRaw
      .slice(0, 6)
      .map((s, i): PathwayStep => {
        const kindRaw = String(s?.kind ?? 'learning').toLowerCase();
        const kind = (VALID_KINDS.has(kindRaw) ? kindRaw : 'learning') as PathwayStep['kind'];
        const suggestions = Array.isArray(s?.suggestions)
          ? s.suggestions
              .filter((x: unknown) => typeof x === 'string' && x.trim() !== '')
              .map((x: unknown) => String(x).slice(0, 200))
              .slice(0, 4)
          : undefined;
        return {
          id: `${key}-${i}`,
          title: String(s?.title ?? '').slice(0, 200),
          rationale: String(s?.rationale ?? '').slice(0, 600),
          kind,
          suggestions,
        };
      })
      .filter((s) => s.title.trim() !== '');

    return {
      key,
      outcome: String(raw?.outcome ?? '').slice(0, 200),
      steps,
    };
  });

  return { title, summary, horizons };
}

function buildContextSummary(
  context: Awaited<ReturnType<typeof getCareerContext>>
): string {
  const profile = context.profile ?? {};
  const p = profile as Record<string, unknown>;
  const compact = {
    university: p.university ?? null,
    degree: p.degree ?? null,
    interests: p.interests ?? null,
    preferredIndustries: p.preferredIndustries ?? null,
    bio: typeof p.bio === 'string' ? String(p.bio).slice(0, 400) : null,
    cvScore: context.cv?.score ?? null,
    activeApplications: context.applications.active.length,
    openTodos: context.todos.open.length,
  };
  return JSON.stringify(compact);
}

export async function POST(req: NextRequest) {
  let uid: string;
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await auth.verifyIdToken(authHeader.slice(7));
    uid = decoded.uid;
  } catch (e) {
    console.error('[POST /api/paths/generate] auth failed', e);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!rateLimit(uid)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    const raw = await req.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
    }
    body = parsed.data;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    const context = await getCareerContext(uid, {
      skipOpportunityMatch: true,
      skipCopilotHistory: true,
      skipActivePaths: true,
    });

    const prompt = buildPrompt({
      goal: body.goal,
      targetRole: body.targetRole,
      targetIndustry: body.targetIndustry,
      contextSummary: buildContextSummary(context),
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You output only valid JSON in the exact shape requested. No commentary before or after.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 2400,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content ?? '{}';
    let raw: RawPathway;
    try {
      raw = JSON.parse(content) as RawPathway;
    } catch {
      raw = {};
    }

    const fallbackTitle = body.targetRole
      ? `Path to ${body.targetRole}`
      : `Pathway for: ${body.goal.slice(0, 50)}`;
    const { title, summary, horizons } = normalisePathway(raw, fallbackTitle);

    const totalSteps = horizons.reduce((acc, h) => acc + h.steps.length, 0);
    if (totalSteps === 0) {
      return NextResponse.json(
        { error: 'Generation produced no steps. Try rephrasing your goal.' },
        { status: 502 }
      );
    }

    const now = new Date();
    const docRef = db.collection('users').doc(uid).collection('generated_pathways').doc();
    const pathway: GeneratedPathway = {
      id: docRef.id,
      title,
      goal: body.goal,
      targetRole: body.targetRole,
      targetIndustry: body.targetIndustry,
      summary,
      horizons,
      createdAt: now.toISOString(),
      lastViewedAt: now.toISOString(),
    };

    await docRef.set({
      title,
      goal: body.goal,
      targetRole: body.targetRole ?? null,
      targetIndustry: body.targetIndustry ?? null,
      summary,
      horizons,
      createdAt: now,
      lastViewedAt: now,
    });

    return NextResponse.json({ pathway });
  } catch (e) {
    console.error('[POST /api/paths/generate]', e);
    return NextResponse.json({ error: 'Failed to generate pathway' }, { status: 500 });
  }
}

/**
 * G.ai agent tool registry.
 *
 * Each tool is the bridge between the LLM and a real Firestore mutation. Tools
 * are the *only* way the agent can act — the model can never reach Firestore
 * directly. Every tool is scoped to the authenticated `uid`, validates its
 * arguments with Zod, and (for anything that touches an existing document)
 * re-verifies ownership before mutating. IDs supplied by the model are treated
 * as untrusted input.
 *
 * Tiers:
 * - read       — no writes, safe to run unconditionally.
 * - reversible — writes that are easy to undo (planner events, todos, saves).
 * - sensitive  — higher-impact writes (path enrolment). Surfaced prominently.
 *
 * The autonomy level (see autonomy.ts) decides whether a tool executes
 * immediately or is returned as a proposed action for the user to confirm.
 */

import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../../../lib/firebase-admin';
import { getPathById } from '@/lib/paths/catalog';
import type { CareerContext } from '@/types/copilot';

export type ToolTier = 'read' | 'reversible' | 'sensitive';

/** Per-request context handed to every tool executor. */
export interface ToolRunContext {
  uid: string;
  career: CareerContext;
  /** User's local date (YYYY-MM-DD) for relative scheduling. */
  todayISO: string;
}

/** Outcome of running (or simulating) a tool. */
export interface ToolResult {
  ok: boolean;
  /** Human-readable outcome, shown on the action card. */
  detail: string;
  /** Firestore doc paths created by this tool — used to build an undo token. */
  undoRefs?: string[];
}

/** A tool as exposed to the agent loop — generics erased for a uniform registry. */
export interface GaiTool {
  name: string;
  tier: ToolTier;
  description: string;
  /** JSON Schema for the OpenAI function definition. */
  parameters: Record<string, unknown>;
  /** Validate raw model-supplied args. */
  validate: (raw: unknown) => { ok: true; data: unknown } | { ok: false; error: string };
  /** Short human label for an executed/proposed action. Assumes validated data. */
  summarize: (data: unknown) => string;
  /** Perform the mutation. Assumes validated data. */
  execute: (ctx: ToolRunContext, data: unknown) => Promise<ToolResult>;
}

/** Build a strongly-typed tool while exposing it through the erased `GaiTool` shape. */
function defineTool<S extends z.ZodTypeAny>(cfg: {
  name: string;
  tier: ToolTier;
  description: string;
  parameters: Record<string, unknown>;
  schema: S;
  summarize: (data: z.infer<S>) => string;
  execute: (ctx: ToolRunContext, data: z.infer<S>) => Promise<ToolResult>;
}): GaiTool {
  return {
    name: cfg.name,
    tier: cfg.tier,
    description: cfg.description,
    parameters: cfg.parameters,
    validate: (raw) => {
      const parsed = cfg.schema.safeParse(raw);
      return parsed.success
        ? { ok: true, data: parsed.data }
        : { ok: false, error: parsed.error.issues.map((i) => i.message).join('; ') };
    },
    // `data` is always the value returned by `validate`, so the cast is sound.
    summarize: (data) => cfg.summarize(data as z.infer<S>),
    execute: (ctx, data) => cfg.execute(ctx, data as z.infer<S>),
  };
}

const ISO_DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD');

// ─────────────────────────────────────────────────────────────────────────────
// read — searchOpportunities
// ─────────────────────────────────────────────────────────────────────────────

const searchOpportunities = defineTool({
  name: 'searchOpportunities',
  tier: 'read',
  description:
    "Search the user's matched and saved opportunities. Use before recommending or saving a role so you reference real listings with real ids.",
  parameters: {
    type: 'object',
    properties: {
      keyword: { type: 'string', description: 'Optional keyword to filter by title, company or location.' },
      limit: { type: 'number', description: 'Max results, 1-10. Default 5.' },
    },
    additionalProperties: false,
  },
  schema: z.object({
    keyword: z.string().max(120).optional(),
    limit: z.number().int().min(1).max(10).optional(),
  }),
  summarize: () => 'Searched your opportunities',
  execute: async (ctx, args) => {
    const pool = [...ctx.career.opportunities.topMatches, ...ctx.career.opportunities.saved];
    const kw = args.keyword?.trim().toLowerCase();
    const filtered = kw
      ? pool.filter((o) =>
          `${o.title} ${o.company} ${o.location}`.toLowerCase().includes(kw)
        )
      : pool;
    const limit = args.limit ?? 5;
    const results = filtered.slice(0, limit).map((o) => ({
      id: o.id,
      title: o.title,
      company: o.company,
      location: o.location,
      url: o.url,
    }));
    return {
      ok: true,
      detail:
        results.length > 0
          ? `Found ${results.length} opportunit${results.length === 1 ? 'y' : 'ies'}: ${JSON.stringify(results)}`
          : 'No matching opportunities in the user catalogue.',
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// reversible — addPlannerEvents
// ─────────────────────────────────────────────────────────────────────────────

const addPlannerEvents = defineTool({
  name: 'addPlannerEvents',
  tier: 'reversible',
  description:
    "Add one or more events to the user's planner. Use this to schedule concrete actions, study blocks or a weekly plan. Dates must be YYYY-MM-DD.",
  parameters: {
    type: 'object',
    properties: {
      events: {
        type: 'array',
        description: 'Up to 8 planner events.',
        items: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'YYYY-MM-DD' },
            title: { type: 'string' },
            notes: { type: 'string' },
          },
          required: ['date', 'title'],
        },
      },
    },
    required: ['events'],
    additionalProperties: false,
  },
  schema: z.object({
    events: z
      .array(
        z.object({
          date: ISO_DATE,
          title: z.string().min(1).max(500).transform((s) => s.trim()),
          notes: z.string().max(2000).optional(),
        })
      )
      .min(1)
      .max(8),
  }),
  summarize: (args) =>
    args.events.length === 1
      ? `Add "${args.events[0].title}" to your planner on ${args.events[0].date}`
      : `Add ${args.events.length} events to your planner`,
  execute: async (ctx, args) => {
    const col = db.collection('users').doc(ctx.uid).collection('planner_events');
    const now = new Date();
    const refs = await Promise.all(
      args.events.map((e) =>
        col.add({
          date: e.date,
          title: e.title,
          notes: e.notes ?? '',
          source: 'copilot',
          createdAt: now,
        })
      )
    );
    return {
      ok: true,
      detail:
        args.events.length === 1
          ? `Added "${args.events[0].title}" to ${args.events[0].date}.`
          : `Added ${args.events.length} events to your planner.`,
      undoRefs: refs.map((r) => r.path),
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// reversible — createTodos
// ─────────────────────────────────────────────────────────────────────────────

const createTodos = defineTool({
  name: 'createTodos',
  tier: 'reversible',
  description:
    "Create to-do items for the user. Use for concrete next actions that are not tied to a specific calendar date.",
  parameters: {
    type: 'object',
    properties: {
      todos: {
        type: 'array',
        description: 'Up to 6 to-dos.',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            notes: { type: 'string' },
            priority: { type: 'string', enum: ['low', 'medium', 'high'] },
          },
          required: ['title'],
        },
      },
    },
    required: ['todos'],
    additionalProperties: false,
  },
  schema: z.object({
    todos: z
      .array(
        z.object({
          title: z.string().min(1).max(300).transform((s) => s.trim()),
          notes: z.string().max(2000).optional(),
          priority: z.enum(['low', 'medium', 'high']).optional(),
        })
      )
      .min(1)
      .max(6),
  }),
  summarize: (args) =>
    args.todos.length === 1
      ? `Add to-do "${args.todos[0].title}"`
      : `Add ${args.todos.length} to-dos to your list`,
  execute: async (ctx, args) => {
    const col = db.collection('actionItems');
    const nowISO = new Date().toISOString();
    const refs = await Promise.all(
      args.todos.map((t) =>
        col.add({
          userId: ctx.uid,
          title: t.title,
          notes: t.notes ?? '',
          priority: t.priority ?? 'medium',
          completed: false,
          source: 'gai',
          createdAt: nowISO,
          updatedAt: nowISO,
        })
      )
    );
    return {
      ok: true,
      detail:
        args.todos.length === 1
          ? `Added to-do "${args.todos[0].title}".`
          : `Added ${args.todos.length} to-dos to your list.`,
      undoRefs: refs.map((r) => r.path),
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// reversible — completeTodo
// ─────────────────────────────────────────────────────────────────────────────

const completeTodo = defineTool({
  name: 'completeTodo',
  tier: 'reversible',
  description:
    "Mark one of the user's existing to-dos as complete. Pass the todoId exactly as it appears in the career context.",
  parameters: {
    type: 'object',
    properties: {
      todoId: { type: 'string', description: 'The id of the to-do to complete.' },
    },
    required: ['todoId'],
    additionalProperties: false,
  },
  schema: z.object({ todoId: z.string().min(1).max(200) }),
  summarize: (args) => `Mark a to-do as complete (${args.todoId.slice(0, 8)}…)`,
  execute: async (ctx, args) => {
    const ref = db.collection('actionItems').doc(args.todoId);
    const snap = await ref.get();
    // Ownership re-check — never trust an id from the model.
    if (!snap.exists || snap.data()?.userId !== ctx.uid) {
      return { ok: false, detail: 'That to-do could not be found on your account.' };
    }
    const title = String(snap.data()?.title ?? 'to-do');
    await ref.set({ completed: true, updatedAt: new Date().toISOString() }, { merge: true });
    return { ok: true, detail: `Marked "${title}" as complete.` };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// reversible — saveOpportunity
// ─────────────────────────────────────────────────────────────────────────────

const saveOpportunity = defineTool({
  name: 'saveOpportunity',
  tier: 'reversible',
  description:
    "Save an opportunity to the user's saved list. Pass an opportunityId returned by searchOpportunities or present in the career context.",
  parameters: {
    type: 'object',
    properties: {
      opportunityId: { type: 'string', description: 'The id of the opportunity to save.' },
    },
    required: ['opportunityId'],
    additionalProperties: false,
  },
  schema: z.object({ opportunityId: z.string().min(1).max(200) }),
  summarize: () => 'Save an opportunity to your list',
  execute: async (ctx, args) => {
    // Resolve from in-memory context first (cheap), then the global collection.
    const fromContext = [
      ...ctx.career.opportunities.topMatches,
      ...ctx.career.opportunities.saved,
    ].find((o) => o.id === args.opportunityId);

    let opp = fromContext;
    if (!opp) {
      const snap = await db.collection('opportunities').doc(args.opportunityId).get();
      if (snap.exists) {
        const d = snap.data() ?? {};
        opp = {
          id: snap.id,
          title: String(d.title ?? ''),
          company: String(d.organization ?? d.company ?? ''),
          location: String(d.location ?? ''),
          url: String(d.url ?? ''),
        };
      }
    }
    if (!opp) {
      return { ok: false, detail: 'That opportunity could not be found.' };
    }

    const alreadySaved = ctx.career.opportunities.saved.some((o) => o.id === opp!.id);
    if (alreadySaved) {
      return { ok: true, detail: `"${opp.title}" is already in your saved list.` };
    }

    await db
      .collection('users')
      .doc(ctx.uid)
      .set(
        {
          savedOpportunitiesData: FieldValue.arrayUnion({
            id: opp.id,
            title: opp.title,
            company: opp.company,
            location: opp.location,
            url: opp.url,
            savedAt: new Date().toISOString(),
          }),
        },
        { merge: true }
      );
    return { ok: true, detail: `Saved "${opp.title}" to your opportunities.` };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// sensitive — enrollInPath
// ─────────────────────────────────────────────────────────────────────────────

const enrollInPath = defineTool({
  name: 'enrollInPath',
  tier: 'sensitive',
  description:
    "Enrol the user in a Gradual capability path. Only use a pathId that exists in the Gradual catalogue. This is a meaningful commitment — prefer to confirm intent first.",
  parameters: {
    type: 'object',
    properties: {
      pathId: { type: 'string', description: 'The catalogue id of the path to enrol in.' },
    },
    required: ['pathId'],
    additionalProperties: false,
  },
  schema: z.object({ pathId: z.string().min(1).max(120) }),
  summarize: (args) => {
    const path = getPathById(args.pathId);
    return path ? `Enrol you in the "${path.title}" path` : 'Enrol you in a capability path';
  },
  execute: async (ctx, args) => {
    const path = getPathById(args.pathId);
    if (!path) {
      return { ok: false, detail: 'That capability path does not exist.' };
    }
    const ref = db.collection('users').doc(ctx.uid).collection('path_state').doc(path.id);
    const existing = await ref.get();
    const now = new Date();
    if (existing.exists) {
      await ref.set({ lastActivityAt: now }, { merge: true });
      return { ok: true, detail: `You're already enrolled in "${path.title}".` };
    }
    await ref.set({
      enrolledAt: now,
      lastActivityAt: now,
      completedModuleIds: [],
      currentModuleId: path.modules[0]?.id ?? null,
      pinned: false,
    });
    return { ok: true, detail: `Enrolled you in the "${path.title}" path.` };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Registry
// ─────────────────────────────────────────────────────────────────────────────

export const TOOLS: GaiTool[] = [
  searchOpportunities,
  addPlannerEvents,
  createTodos,
  completeTodo,
  saveOpportunity,
  enrollInPath,
];

const TOOL_BY_NAME = new Map(TOOLS.map((t) => [t.name, t]));

export function getTool(name: string): GaiTool | undefined {
  return TOOL_BY_NAME.get(name);
}

/** OpenAI `tools` array for the chat completion call. */
export function toolDefinitions(): {
  type: 'function';
  function: { name: string; description: string; parameters: Record<string, unknown> };
}[] {
  return TOOLS.map((t) => ({
    type: 'function',
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));
}

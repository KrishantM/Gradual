/**
 * G.ai autonomy levels — how much the agent is allowed to act on its own.
 *
 * The level is stored per-user on users/{uid}.gaiAutonomy and is switchable
 * from the right control pane. New users default to `full_auto`.
 *
 * - full_auto — G.ai executes actions itself. Reversible actions (planner
 *   events, todos, saving opportunities) run instantly with an undo; sensitive
 *   actions (CV rewrite, path enrolment, bulk writes) also run, but are always
 *   surfaced clearly so the user can reverse them.
 * - confirm   — G.ai proposes actions as confirm cards; nothing is written
 *   until the user approves.
 * - manual    — G.ai never acts. It only answers and suggests (the original
 *   pre-agentic behaviour).
 */

export type GaiAutonomy = 'full_auto' | 'confirm' | 'manual';

export const DEFAULT_AUTONOMY: GaiAutonomy = 'full_auto';

const VALID: readonly GaiAutonomy[] = ['full_auto', 'confirm', 'manual'];

/** Coerce any stored/incoming value to a valid autonomy level, falling back to the default. */
export function normalizeAutonomy(value: unknown): GaiAutonomy {
  return typeof value === 'string' && (VALID as readonly string[]).includes(value)
    ? (value as GaiAutonomy)
    : DEFAULT_AUTONOMY;
}

/** Whether the agent may run a tool loop at all (manual mode is suggestion-only). */
export function isAgentic(autonomy: GaiAutonomy): autonomy is Exclude<GaiAutonomy, 'manual'> {
  return autonomy !== 'manual';
}

/** Whether reversible write tools may execute without an explicit confirm step. */
export function autoExecutesReversible(autonomy: GaiAutonomy): boolean {
  return autonomy === 'full_auto';
}

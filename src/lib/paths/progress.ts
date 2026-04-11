/**
 * Progress helpers — server + client safe (no Firebase imports).
 *
 * Hydrates a Path with a user's PathState into a PathProgress view, and
 * computes the user's "active path" (most recent enrollment with at least
 * one incomplete module).
 */

import type { Path, PathProgress, PathState } from './types';

export function hydratePathProgress(path: Path, state: PathState | null): PathProgress {
  const completedSet = new Set(state?.completedModuleIds ?? []);
  const completedCount = path.modules.filter((m) => completedSet.has(m.id)).length;
  const totalCount = path.modules.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  // Current module = explicit pointer if valid, otherwise first incomplete
  let currentModule = null;
  if (state?.currentModuleId) {
    const found = path.modules.find((m) => m.id === state.currentModuleId);
    if (found && !completedSet.has(found.id)) currentModule = found;
  }
  if (!currentModule) {
    currentModule = path.modules.find((m) => !completedSet.has(m.id)) ?? null;
  }

  // Next module = first incomplete after the current one
  let nextModule = null;
  if (currentModule) {
    const idx = path.modules.findIndex((m) => m.id === currentModule!.id);
    nextModule = path.modules.slice(idx + 1).find((m) => !completedSet.has(m.id)) ?? null;
  }

  return {
    path,
    state,
    isEnrolled: state !== null,
    completedCount,
    totalCount,
    progressPercent,
    currentModule,
    nextModule,
  };
}

/**
 * Pick the user's "active" path for surfacing on dashboard / copilot context.
 * Strategy: pinned beats unpinned; among the rest, most-recent activity wins;
 * fully-completed paths are excluded.
 */
export function pickActivePath(progresses: PathProgress[]): PathProgress | null {
  const candidates = progresses.filter((p) => p.isEnrolled && p.progressPercent < 100);
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    const aPin = a.state?.pinned ? 1 : 0;
    const bPin = b.state?.pinned ? 1 : 0;
    if (aPin !== bPin) return bPin - aPin;
    const aTime = a.state?.lastActivityAt ? new Date(a.state.lastActivityAt).getTime() : 0;
    const bTime = b.state?.lastActivityAt ? new Date(b.state.lastActivityAt).getTime() : 0;
    return bTime - aTime;
  });
  return candidates[0];
}

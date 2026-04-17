/**
 * GET /api/paths
 *
 * Returns:
 *   - all paths in the catalog hydrated with this user's progress
 *   - a list of recommended paths (with reasons), excluding ones already enrolled
 *   - the user's currently active path (if any)
 *
 * No request body. Auth required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';
import { PATHS } from '@/lib/paths/catalog';
import { hydratePathProgress, pickActivePath } from '@/lib/paths/progress';
import { recommendPaths } from '@/lib/paths/recommend';
import { getCareerContext } from '@/lib/copilot/get-career-context';
import { evaluateSignals } from '@/lib/copilot/evaluate-signals';
import type { PathState } from '@/lib/paths/types';

type TimestampLike = { toDate?: () => Date } | Date | string;

function toISO(d: TimestampLike | null | undefined): string | null {
  if (!d) return null;
  if (typeof d === 'string') return d;
  const t = d as { toDate?: () => Date };
  if (typeof t.toDate === 'function') return t.toDate().toISOString();
  if (d instanceof Date) return d.toISOString();
  return null;
}

export async function GET(req: NextRequest) {
  let uid: string;
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await auth.verifyIdToken(authHeader.slice(7));
    uid = decoded.uid;
  } catch (e) {
    console.error('[GET /api/paths] auth failed', e);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch user path states and career context in parallel
  const stateMap = new Map<string, PathState>();
  let careerContext: Awaited<ReturnType<typeof getCareerContext>> | null = null;

  const [stateSnap, contextResult] = await Promise.allSettled([
    db.collection('users').doc(uid).collection('path_state').get(),
    getCareerContext(uid),
  ]);

  if (stateSnap.status === 'fulfilled') {
    stateSnap.value.forEach((doc) => {
      const d = doc.data();
      const enrolledAt = toISO(d.enrolledAt as TimestampLike) ?? new Date().toISOString();
      const lastActivityAt = toISO(d.lastActivityAt as TimestampLike) ?? enrolledAt;
      stateMap.set(doc.id, {
        pathId: doc.id,
        enrolledAt,
        completedModuleIds: Array.isArray(d.completedModuleIds) ? d.completedModuleIds : [],
        currentModuleId: (d.currentModuleId as string) ?? null,
        pinned: Boolean(d.pinned),
        lastActivityAt,
      });
    });
  } else {
    console.error('[GET /api/paths] failed to read path_state', stateSnap.reason);
  }

  if (contextResult.status === 'fulfilled') {
    careerContext = contextResult.value;
  } else {
    console.error('[GET /api/paths] getCareerContext failed', contextResult.reason);
  }

  // Hydrate every path with the user's state
  const progresses = PATHS.map((path) => hydratePathProgress(path, stateMap.get(path.id) ?? null));
  const activePath = pickActivePath(progresses);

  // Recommendations — best-effort using pre-fetched context
  let recommendations: Awaited<ReturnType<typeof recommendPaths>> = [];
  try {
    if (careerContext) {
      const signals = evaluateSignals(careerContext);
      const enrolledIds = progresses.filter((p) => p.isEnrolled).map((p) => p.path.id);
      recommendations = recommendPaths({
        context: careerContext,
        signals,
        excludePathIds: enrolledIds,
        limit: 3,
      });
    }
  } catch (e) {
    console.error('[GET /api/paths] recommendations failed', e);
  }

  return NextResponse.json({
    paths: progresses,
    activePath,
    recommendations,
  });
}

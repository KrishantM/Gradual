/**
 * GET /api/paths
 *
 * Returns the user's path_state hydrated against the static catalog. This
 * endpoint is intentionally lightweight — it does NOT compute recommendations
 * (which require the heavy career context aggregator). Recommendations live
 * at /api/paths/recommendations and are fetched in parallel by the client.
 *
 * Response:
 *   - paths: every catalog path hydrated with the user's progress
 *   - activePath: the user's currently focused path (pinned > most-recent)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';
import { PATHS } from '@/lib/paths/catalog';
import { hydratePathProgress, pickActivePath } from '@/lib/paths/progress';
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

  const stateMap = new Map<string, PathState>();
  try {
    const stateSnap = await db.collection('users').doc(uid).collection('path_state').get();
    stateSnap.forEach((doc) => {
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
  } catch (e) {
    console.error('[GET /api/paths] failed to read path_state', e);
  }

  const progresses = PATHS.map((path) => hydratePathProgress(path, stateMap.get(path.id) ?? null));
  const activePath = pickActivePath(progresses);

  return NextResponse.json(
    { paths: progresses, activePath },
    { headers: { 'Cache-Control': 'private, max-age=20, stale-while-revalidate=60' } }
  );
}

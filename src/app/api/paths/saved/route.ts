/**
 * GET /api/paths/saved
 *
 * Returns the authenticated user's most recent generated pathways
 * (full documents — limited to the latest 10).
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';
import {
  HORIZON_ORDER,
  type GeneratedPathway,
  type HorizonKey,
  type PathwayHorizon,
  type PathwayStep,
} from '@/lib/paths/pathway-types';

const LIMIT = 10;
const VALID_KINDS = new Set(['skill', 'project', 'learning', 'experience', 'opportunity']);

type TimestampLike = { toDate?: () => Date } | Date | string;

function toISO(d: TimestampLike | null | undefined): string {
  if (!d) return new Date().toISOString();
  if (typeof d === 'string') return d;
  const t = d as { toDate?: () => Date };
  if (typeof t.toDate === 'function') return t.toDate().toISOString();
  if (d instanceof Date) return d.toISOString();
  return new Date().toISOString();
}

function hydrateHorizons(rawHorizons: unknown): PathwayHorizon[] {
  const byKey = new Map<HorizonKey, unknown>();
  if (Array.isArray(rawHorizons)) {
    for (const h of rawHorizons) {
      const k = (h as { key?: string })?.key as HorizonKey;
      if (HORIZON_ORDER.includes(k)) byKey.set(k, h);
    }
  }
  return HORIZON_ORDER.map((key) => {
    const raw = byKey.get(key) as { outcome?: string; steps?: unknown[] } | undefined;
    const stepsRaw = Array.isArray(raw?.steps) ? raw!.steps : [];
    const steps: PathwayStep[] = stepsRaw
      .map((s, i): PathwayStep => {
        const r = s as {
          id?: string;
          title?: string;
          rationale?: string;
          kind?: string;
          suggestions?: unknown[];
        };
        const kindRaw = String(r?.kind ?? 'learning').toLowerCase();
        const kind = (VALID_KINDS.has(kindRaw) ? kindRaw : 'learning') as PathwayStep['kind'];
        const suggestions = Array.isArray(r?.suggestions)
          ? r.suggestions
              .filter((x: unknown) => typeof x === 'string' && x.trim() !== '')
              .map((x: unknown) => String(x))
          : undefined;
        return {
          id: String(r?.id ?? `${key}-${i}`),
          title: String(r?.title ?? ''),
          rationale: String(r?.rationale ?? ''),
          kind,
          suggestions,
        };
      })
      .filter((s) => s.title.trim() !== '');
    return {
      key,
      outcome: String(raw?.outcome ?? ''),
      steps,
    };
  });
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
    console.error('[GET /api/paths/saved] auth failed', e);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const snap = await db
      .collection('users')
      .doc(uid)
      .collection('generated_pathways')
      .orderBy('lastViewedAt', 'desc')
      .limit(LIMIT)
      .get();

    const pathways: GeneratedPathway[] = [];
    snap.forEach((doc) => {
      const d = doc.data();
      pathways.push({
        id: doc.id,
        title: String(d.title ?? 'Untitled pathway'),
        goal: String(d.goal ?? ''),
        targetRole: d.targetRole ? String(d.targetRole) : undefined,
        targetIndustry: d.targetIndustry ? String(d.targetIndustry) : undefined,
        summary: String(d.summary ?? ''),
        horizons: hydrateHorizons(d.horizons),
        createdAt: toISO(d.createdAt as TimestampLike),
        lastViewedAt: toISO(d.lastViewedAt as TimestampLike),
      });
    });

    return NextResponse.json(
      { pathways },
      { headers: { 'Cache-Control': 'private, max-age=15, stale-while-revalidate=60' } }
    );
  } catch (e) {
    console.error('[GET /api/paths/saved]', e);
    return NextResponse.json({ error: 'Failed to load pathways' }, { status: 500 });
  }
}

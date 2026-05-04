/**
 * POST /api/recruiter/students
 *
 * Returns a privacy-safe list of candidate previews for the recruiter UI.
 * Two hard rules enforced here:
 *
 *   1. Access gate — only callers with `hasAccess: true` (paid recruiter or
 *      demo bypass) get any candidate data. Everyone else gets a 403.
 *   2. Privacy boundary — every candidate is run through
 *      `getRecruiterSafeCandidate(...)` before leaving the server. Raw user
 *      docs never reach the client.
 *
 * NB: The previous version of this route returned raw university/degree/bio
 * fields. We've narrowed that here to the recruiter-safe preview shape.
 */

import { NextRequest, NextResponse } from 'next/server';
import { resolveRecruiterAccessFromToken } from '@/lib/recruiter/access';
import {
  getRecruiterSafeCandidate,
  type RecruiterCandidatePreview,
} from '@/lib/recruiter/safe-candidate';
import { db } from '../../../../../lib/firebase-admin';

interface RecruiterFilters {
  cvScoreMin?: number;
  cvScoreMax?: number;
  hasPortfolio?: boolean;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  const { access } = await resolveRecruiterAccessFromToken(token);

  if (!access.hasAccess) {
    return NextResponse.json(
      { error: 'Recruiter access required', reason: access.reason },
      { status: 403 }
    );
  }

  let body: { search?: string; filters?: RecruiterFilters; limit?: number };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const search = (body.search ?? '').trim().toLowerCase();
  const filters = body.filters ?? {};
  const limit = Math.min(Math.max(body.limit ?? 24, 1), 60);

  let snap;
  try {
    // Pull a generous pool, then filter/score in-memory. For demo scale this
    // is fine; replace with proper composite indices when scaling past ~500
    // candidates.
    snap = await db.collection('users').limit(limit * 2).get();
  } catch (e) {
    console.error('[POST /api/recruiter/students] fetch failed', e);
    return NextResponse.json(
      { error: 'Could not load candidates', candidates: [] },
      { status: 500 }
    );
  }

  const allCandidates: RecruiterCandidatePreview[] = [];

  snap.forEach((doc) => {
    const raw = doc.data() ?? {};

    // Honour student-level privacy flags. If a user has marked their
    // profile private OR opted out of recruiter discovery, they're not in
    // the results — full stop.
    if (raw.isProfilePublic === false) return;
    if (raw.allowRecruiterContact === false) return;

    // Don't surface accounts that haven't completed even a baseline.
    const hasName = typeof raw.fullName === 'string' && raw.fullName.trim().length > 0;
    if (!hasName) return;

    allCandidates.push(getRecruiterSafeCandidate(doc.id, raw));
  });

  // Filter — only on safe fields we already exposed.
  let filtered = allCandidates;

  if (typeof filters.cvScoreMin === 'number') {
    const min = filters.cvScoreMin;
    filtered = filtered.filter((c) => (c.cvScore ?? 0) >= min);
  }
  if (typeof filters.cvScoreMax === 'number' && filters.cvScoreMax < 100) {
    const max = filters.cvScoreMax;
    filtered = filtered.filter((c) => (c.cvScore ?? 0) <= max);
  }

  if (search) {
    filtered = filtered.filter((c) => {
      const haystack = [
        c.displayName,
        c.studyArea ?? '',
        c.region ?? '',
        c.headline ?? '',
        ...c.interests,
        ...c.skills,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(search);
    });
  }

  // Sort: highest CV score first, then most recently active. Pushes nulls
  // (unscored candidates) to the back without dropping them.
  filtered.sort((a, b) => {
    const scoreDiff = (b.cvScore ?? -1) - (a.cvScore ?? -1);
    if (scoreDiff !== 0) return scoreDiff;
    return (b.lastActiveISO ?? '').localeCompare(a.lastActiveISO ?? '');
  });

  return NextResponse.json(
    {
      candidates: filtered.slice(0, limit),
      total: filtered.length,
      isDemo: access.isDemo,
    },
    { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=120' } }
  );
}

import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '../../../../../lib/firebase-admin';
import { verifyOpportunityLinks, type LinkVerdict } from '@/lib/opportunities-engine/link-validator';

const REJECT_VERDICTS: ReadonlySet<LinkVerdict> = new Set<LinkVerdict>([
  'dead', 'soft_404', 'redirected_generic', 'invalid_url',
]);

export const maxDuration = 60;

/**
 * POST /api/opportunities-engine/validate-links
 *
 * Runs link validation on stored opportunities. Bad verdicts (dead, soft_404,
 * redirected_generic, invalid_url) mark the opportunity as `expired`. Designed
 * to be invoked periodically AND for one-off catalog re-scans after a verifier
 * upgrade.
 *
 * Body:
 *   - limit?: number       max 500, default 100
 *   - force?: boolean      bypass the 7-day-since-last-check cooldown
 *   - cursor?: string      doc id to resume after (for batched full rescans)
 *   - includeExpired?: boolean   also re-check docs already marked expired
 *                                (useful when bringing previously-rejected
 *                                links back through the new verifier)
 *
 * Response:
 *   - stats: { checked, dead, valid, skipped, recovered }
 *   - nextCursor: string|null   pass back as `cursor` to continue
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      await auth.verifyIdToken(authHeader.split('Bearer ')[1]);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Math.max(1, Number(body.limit) || 100), 500);
    const force = body.force === true;
    const includeExpired = body.includeExpired === true;
    const cursor: string | null = typeof body.cursor === 'string' && body.cursor ? body.cursor : null;

    const opportunitiesRef = db.collection('opportunities');

    // Stable order on doc id for cursor pagination.
    let baseQuery = includeExpired
      ? opportunitiesRef.where('status', 'in', ['active', 'expired'])
      : opportunitiesRef.where('status', '==', 'active');

    baseQuery = baseQuery.orderBy('__name__').limit(limit);

    if (cursor) {
      const cursorDoc = await opportunitiesRef.doc(cursor).get();
      if (cursorDoc.exists) {
        baseQuery = baseQuery.startAfter(cursorDoc);
      }
    }

    const snapshot = await baseQuery.get();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoff = sevenDaysAgo.toISOString();

    const toCheck = force
      ? snapshot.docs
      : snapshot.docs.filter(doc => {
          const lastChecked = doc.data().validation?.lastChecked;
          return !lastChecked || lastChecked < cutoff;
        });

    const lastDocInPage = snapshot.docs[snapshot.docs.length - 1];
    const nextCursor = snapshot.docs.length === limit && lastDocInPage ? lastDocInPage.id : null;

    if (toCheck.length === 0) {
      return NextResponse.json({
        success: true,
        message: snapshot.docs.length === 0
          ? 'No more opportunities to scan'
          : 'No opportunities in this batch needed re-checking (use force=true to override cooldown)',
        stats: { checked: 0, dead: 0, valid: 0, skipped: snapshot.docs.length, recovered: 0 },
        nextCursor,
      });
    }

    const urls = toCheck.map(doc => doc.data().url as string).filter(Boolean);
    const results = await verifyOpportunityLinks(urls, {
      concurrency: 8,
      perUrlBudgetMs: 7_000,
      totalBudgetMs: 45_000,
    });

    let dead = 0;
    let valid = 0;
    let recovered = 0;

    for (const result of results) {
      const matchingDoc = toCheck.find(doc => doc.data().url === result.url);
      if (!matchingDoc) continue;

      const data = matchingDoc.data();
      const isBad = REJECT_VERDICTS.has(result.verdict);
      const existingFlags: string[] = data.validation?.flags || [];
      const wasExpired = data.status === 'expired';

      const baseUpdate: Record<string, unknown> = {
        'validation.lastChecked': result.checkedAt,
        'validation.linkStatus': result.statusCode ?? result.verdict,
      };

      if (isBad) {
        dead++;
        await matchingDoc.ref.update({
          ...baseUpdate,
          'validation.flags': Array.from(new Set([...existingFlags, `link_${result.verdict}`])),
          'validation.isVerified': false,
          status: 'expired',
        });
      } else {
        valid++;
        // Strip any prior link_* flags now that the URL passed.
        const cleanedFlags = existingFlags.filter(f => !f.startsWith('link_'));
        const update: Record<string, unknown> = {
          ...baseUpdate,
          'validation.flags': cleanedFlags,
          'validation.isVerified': result.trusted,
          ...(result.trusted ? { 'validation.verifiedAt': result.checkedAt } : {}),
        };
        // If we're re-checking docs previously marked expired and they now pass,
        // restore them to active.
        if (wasExpired && result.trusted) {
          update.status = 'active';
          recovered++;
        }
        await matchingDoc.ref.update(update);
      }
    }

    console.log(`[ValidateLinks] Checked ${results.length}: ${valid} valid, ${dead} dead, ${recovered} recovered. NextCursor=${nextCursor ?? 'none'}`);

    return NextResponse.json({
      success: true,
      stats: {
        checked: results.length,
        dead,
        valid,
        skipped: snapshot.docs.length - toCheck.length,
        recovered,
      },
      nextCursor,
    });
  } catch (error) {
    console.error('[ValidateLinks] Error:', error);
    return NextResponse.json(
      { error: 'Validation failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/opportunities-engine/validate-links',
    method: 'POST',
    description: 'Validates links for stored opportunities and flags dead ones. Supports cursor pagination for full catalog rescans.',
    authentication: 'Bearer token required',
    body: {
      limit: 'number (optional, default 100, max 500)',
      force: 'boolean (optional) — bypass the 7-day cooldown',
      cursor: 'string (optional) — doc id to resume after',
      includeExpired: 'boolean (optional) — also re-check status:expired docs (lets recovered links return to active)',
    },
    response: {
      stats: '{ checked, dead, valid, skipped, recovered }',
      nextCursor: 'string|null — pass back as cursor to continue',
    },
  });
}

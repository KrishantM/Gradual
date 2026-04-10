import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '../../../../../lib/firebase-admin';
import { validateLinks } from '@/lib/opportunities-engine/link-validator';

/**
 * POST /api/opportunities-engine/validate-links
 *
 * Runs link validation on stored opportunities that haven't been checked recently.
 * Flags dead links (404/410/DNS failure) by marking them as expired.
 * Designed to be run periodically (e.g., daily cron) to keep opportunity quality high.
 *
 * Body: { limit?: number (default 100, max 200) }
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
    const limit = Math.min(body.limit || 100, 200);

    const opportunitiesRef = db.collection('opportunities');

    // Find active opportunities that haven't been link-checked in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoff = sevenDaysAgo.toISOString();

    // Get opportunities where lastChecked is old or missing
    const uncheckedQuery = await opportunitiesRef
      .where('status', '==', 'active')
      .limit(limit)
      .get();

    // Filter in-memory for those not recently checked
    const toCheck = uncheckedQuery.docs.filter(doc => {
      const data = doc.data();
      const lastChecked = data.validation?.lastChecked;
      return !lastChecked || lastChecked < cutoff;
    });

    if (toCheck.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All active opportunities have been recently validated',
        stats: { checked: 0, dead: 0, valid: 0 },
      });
    }

    const urls = toCheck.map(doc => doc.data().url as string).filter(Boolean);
    const results = await validateLinks(urls, 5);

    let dead = 0;
    let valid = 0;

    for (const result of results) {
      const matchingDoc = toCheck.find(doc => doc.data().url === result.url);
      if (!matchingDoc) continue;

      if (result.isValid) {
        valid++;
        await matchingDoc.ref.update({
          'validation.lastChecked': result.checkedAt,
          'validation.linkStatus': result.statusCode || 'ok',
        });
      } else {
        dead++;
        const existingFlags = matchingDoc.data().validation?.flags || [];
        await matchingDoc.ref.update({
          'validation.lastChecked': result.checkedAt,
          'validation.linkStatus': result.statusCode || result.error,
          'validation.flags': [...existingFlags, `dead_link:${result.error}`],
          'status': 'expired',
        });
      }
    }

    console.log(`[ValidateLinks] Checked ${results.length} links: ${valid} valid, ${dead} dead`);

    return NextResponse.json({
      success: true,
      stats: {
        checked: results.length,
        dead,
        valid,
        skipped: uncheckedQuery.docs.length - toCheck.length,
      },
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
    description: 'Validates links for stored opportunities and flags dead ones',
    authentication: 'Bearer token required',
    body: { limit: 'number (optional, default 100, max 200)' },
  });
}

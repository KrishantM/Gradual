import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '../../../../../lib/firebase-admin';
import { runAllConnectors } from '@/lib/opportunities-engine/connectors';
import { Opportunity } from '@/types/opportunities';
import { validateLinks, normalizeUrl } from '@/lib/opportunities-engine/link-validator';

const BATCH_SIZE = 450;
// Firestore caps the `in` operator at 30 values per query.
const IN_QUERY_LIMIT = 30;

async function storeOpportunities(opportunities: Opportunity[]): Promise<{ added: number; updated: number }> {
  let added = 0;
  let updated = 0;
  const opportunitiesRef = db.collection('opportunities');

  for (let i = 0; i < opportunities.length; i += BATCH_SIZE) {
    const chunk = opportunities.slice(i, i + BATCH_SIZE);

    // Resolve existing docs for the whole chunk up-front via batched `in`
    // queries — avoids N+1 round-trips that previously made manual refreshes
    // time out on large pulls.
    const existingRefs = new Map<string, FirebaseFirestore.DocumentReference>();
    const ids = chunk.map((o) => o.id).filter(Boolean);
    for (let j = 0; j < ids.length; j += IN_QUERY_LIMIT) {
      const idChunk = ids.slice(j, j + IN_QUERY_LIMIT);
      if (idChunk.length === 0) continue;
      const snap = await opportunitiesRef.where('id', 'in', idChunk).get();
      snap.forEach((doc) => {
        const data = doc.data();
        if (data?.id) existingRefs.set(data.id, doc.ref);
      });
    }

    const batch = db.batch();
    for (const opp of chunk) {
      const docData = sanitizeForFirestore(opp);
      const existingRef = existingRefs.get(opp.id);
      if (!existingRef) {
        const docRef = opportunitiesRef.doc();
        batch.set(docRef, { ...docData, ingestedAt: new Date().toISOString() });
        added++;
      } else {
        batch.update(existingRef, { ...docData, updatedAt: new Date().toISOString() });
        updated++;
      }
    }

    await batch.commit();
  }

  return { added, updated };
}

function deepClean(value: unknown): unknown {
  if (value === undefined || value === null) return null;
  if (Array.isArray(value)) {
    return value.filter(v => v !== undefined).map(deepClean);
  }
  if (typeof value === 'object' && value !== null) {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (v === undefined) continue;
      cleaned[k] = deepClean(v);
    }
    return cleaned;
  }
  return value;
}

function sanitizeForFirestore(opp: Opportunity): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(opp)) {
    if (value === undefined) continue;
    if (key === 'rawSourceData') continue;
    clean[key] = deepClean(value);
  }
  return clean;
}

async function cleanupStaleOpportunities(): Promise<number> {
  const opportunitiesRef = db.collection('opportunities');
  const now = new Date();
  let cleaned = 0;

  const deadlineExpired = await opportunitiesRef
    .where('deadline', '<', now.toISOString())
    .limit(200)
    .get();

  if (!deadlineExpired.empty) {
    const batch = db.batch();
    for (const doc of deadlineExpired.docs) {
      const data = doc.data();
      if (data.type === 'club') continue;
      batch.update(doc.ref, { status: 'expired' });
      cleaned++;
    }
    await batch.commit();
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffStr = cutoff.toISOString();

  const expiredQuery = await opportunitiesRef
    .where('status', '==', 'expired')
    .limit(200)
    .get();

  if (!expiredQuery.empty) {
    const batch = db.batch();
    for (const doc of expiredQuery.docs) {
      const data = doc.data();
      const updatedAt = data.updatedAt || data.ingestedAt || data.createdAt || '';
      if (updatedAt && updatedAt < cutoffStr) {
        batch.delete(doc.ref);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      await batch.commit();
    }
  }

  return cleaned;
}

// Per-user cooldown — reading from `opportunities_meta/last_refresh` (global)
// would let one user block everyone. Cooldown is enforced per-uid instead.
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const lastUserRefresh = new Map<string, number>();

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let uid: string;
    try {
      const decoded = await auth.verifyIdToken(authHeader.split('Bearer ')[1]);
      uid = decoded.uid;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Cooldown guard
    const now = Date.now();
    const last = lastUserRefresh.get(uid) ?? 0;
    if (now - last < COOLDOWN_MS) {
      const retryInMs = COOLDOWN_MS - (now - last);
      return NextResponse.json(
        {
          error: 'Refresh cooldown active',
          retryInSeconds: Math.ceil(retryInMs / 1000),
        },
        { status: 429 }
      );
    }
    lastUserRefresh.set(uid, now);

    const body = await req.json().catch(() => ({}));
    const maxResults = body.maxResults || 200;

    console.log('[Ingest] Starting opportunity ingestion...');
    const ingestionResult = await runAllConnectors({ maxResults }, body.userProfile);

    console.log(`[Ingest] Fetched ${ingestionResult.totalFetched}, validated ${ingestionResult.totalValidated}, deduplicated to ${ingestionResult.totalDeduplicated}, fresh: ${ingestionResult.totalFresh}`);

    // Normalize URLs before storing
    const normalizedOpportunities = ingestionResult.opportunities.map(opp => ({
      ...opp,
      url: normalizeUrl(opp.url),
      canonicalUrl: opp.canonicalUrl ? normalizeUrl(opp.canonicalUrl) : undefined,
    }));

    const storeResult = await storeOpportunities(normalizedOpportunities);
    console.log(`[Ingest] Stored: ${storeResult.added} new, ${storeResult.updated} updated`);

    // Link validation: check a sample of newly stored opportunities
    let linksChecked = 0;
    let deadLinks = 0;
    try {
      const urlsToCheck = normalizedOpportunities
        .slice(0, 50) // Check up to 50 URLs per ingestion to avoid rate limiting
        .map(opp => opp.url);

      const linkResults = await validateLinks(urlsToCheck, 5);
      linksChecked = linkResults.length;
      const deadResults = linkResults.filter(r => !r.isValid);
      deadLinks = deadResults.length;

      // Flag dead links in Firestore
      if (deadResults.length > 0) {
        const opportunitiesRef = db.collection('opportunities');
        for (const dead of deadResults) {
          const matchQuery = await opportunitiesRef
            .where('url', '==', dead.url)
            .limit(1)
            .get();
          if (!matchQuery.empty) {
            await matchQuery.docs[0].ref.update({
              'validation.flags': [...(matchQuery.docs[0].data().validation?.flags || []), `dead_link:${dead.error}`],
              'validation.lastChecked': dead.checkedAt,
              'status': 'expired',
            });
          }
        }
        console.log(`[Ingest] Flagged ${deadLinks} dead links`);
      }
    } catch (linkErr) {
      console.warn('[Ingest] Link validation failed (non-fatal):', linkErr instanceof Error ? linkErr.message : linkErr);
    }

    let cleaned = 0;
    try {
      cleaned = await cleanupStaleOpportunities();
      console.log(`[Ingest] Cleaned ${cleaned} stale opportunities`);
    } catch (cleanupErr) {
      console.warn('[Ingest] Cleanup failed (non-fatal):', cleanupErr instanceof Error ? cleanupErr.message : cleanupErr);
    }

    // Update the global last-refresh timestamp so the UI reflects the manual pull.
    try {
      await db.collection('opportunities_meta').doc('last_refresh').set({
        refreshedAt: new Date().toISOString(),
        totalStored: storeResult.added + storeResult.updated,
        triggeredBy: 'manual',
      });
    } catch { /* non-fatal */ }

    return NextResponse.json({
      success: true,
      stats: {
        fetched: ingestionResult.totalFetched,
        validated: ingestionResult.totalValidated,
        deduplicated: ingestionResult.totalDeduplicated,
        fresh: ingestionResult.totalFresh,
        stored: storeResult.added,
        updated: storeResult.updated,
        cleaned,
        linksChecked,
        deadLinks,
        durationMs: ingestionResult.durationMs,
        bySource: ingestionResult.bySource,
      },
      errors: ingestionResult.errors,
    });
  } catch (error) {
    console.error('[Ingest] Error:', error);
    return NextResponse.json(
      { error: 'Ingestion failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/opportunities-engine/ingest',
    method: 'POST',
    description: 'Triggers opportunity ingestion from all connectors',
    authentication: 'Bearer token required',
    body: {
      maxResults: 'number (optional, default 50) - max results per connector',
      userProfile: 'object (optional) - user profile for personalized fetching',
    },
  });
}

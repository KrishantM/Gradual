import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '../../../../../lib/firebase-admin';
import { runAllConnectors } from '@/lib/opportunities-engine/connectors';
import { Opportunity } from '@/types/opportunities';

const BATCH_SIZE = 450;

async function storeOpportunities(opportunities: Opportunity[]): Promise<{ added: number; updated: number }> {
  let added = 0;
  let updated = 0;
  const opportunitiesRef = db.collection('opportunities');

  for (let i = 0; i < opportunities.length; i += BATCH_SIZE) {
    const chunk = opportunities.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    for (const opp of chunk) {
      const existingQuery = await opportunitiesRef
        .where('id', '==', opp.id)
        .limit(1)
        .get();

      const docData = sanitizeForFirestore(opp);

      if (existingQuery.empty) {
        const docRef = opportunitiesRef.doc();
        batch.set(docRef, { ...docData, ingestedAt: new Date().toISOString() });
        added++;
      } else {
        const docRef = existingQuery.docs[0].ref;
        batch.update(docRef, { ...docData, updatedAt: new Date().toISOString() });
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
    const maxResults = body.maxResults || 200;

    console.log('[Ingest] Starting opportunity ingestion...');
    const ingestionResult = await runAllConnectors({ maxResults }, body.userProfile);

    console.log(`[Ingest] Fetched ${ingestionResult.totalFetched}, validated ${ingestionResult.totalValidated}, deduplicated to ${ingestionResult.totalDeduplicated}, fresh: ${ingestionResult.totalFresh}`);

    const storeResult = await storeOpportunities(ingestionResult.opportunities);
    console.log(`[Ingest] Stored: ${storeResult.added} new, ${storeResult.updated} updated`);

    let cleaned = 0;
    try {
      cleaned = await cleanupStaleOpportunities();
      console.log(`[Ingest] Cleaned ${cleaned} stale opportunities`);
    } catch (cleanupErr) {
      console.warn('[Ingest] Cleanup failed (non-fatal):', cleanupErr instanceof Error ? cleanupErr.message : cleanupErr);
    }

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

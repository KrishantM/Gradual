import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '../../../../../lib/firebase-admin';
import { runAllConnectors } from '@/lib/opportunities-engine/connectors';
import { Opportunity } from '@/types/opportunities';
import {
  normalizeUrl,
  verifyOpportunityLinks,
  type LinkVerdict,
  type LinkVerificationResult,
} from '@/lib/opportunities-engine/link-validator';

const REJECT_VERDICTS: ReadonlySet<LinkVerdict> = new Set<LinkVerdict>([
  'dead',
  'soft_404',
  'redirected_generic',
  'invalid_url',
]);

const FLAG_VERDICTS: ReadonlySet<LinkVerdict> = new Set<LinkVerdict>([
  'auth_required',
  'server_error',
  'timeout',
  'inconclusive',
]);

interface VerificationOutcome {
  kept: Opportunity[];
  rejected: { opp: Opportunity; result: LinkVerificationResult }[];
  stats: Record<LinkVerdict | 'unverified', number>;
}

function applyValidation(opp: Opportunity, result: LinkVerificationResult | null): Opportunity {
  const previous = opp.validation ?? { isVerified: false, trustScore: 0 };
  if (!result) {
    return {
      ...opp,
      validation: {
        ...previous,
        flags: [...(previous.flags ?? []), 'link_unverified'],
        lastChecked: new Date().toISOString(),
      },
    };
  }
  const flags = [...(previous.flags ?? [])];
  if (FLAG_VERDICTS.has(result.verdict)) flags.push(`link_${result.verdict}`);
  return {
    ...opp,
    validation: {
      ...previous,
      isVerified: result.trusted,
      verifiedAt: result.trusted ? result.checkedAt : previous.verifiedAt,
      lastChecked: result.checkedAt,
      flags: flags.length ? Array.from(new Set(flags)) : previous.flags,
      trustScore: result.trusted ? Math.max(previous.trustScore ?? 0, 75) : previous.trustScore ?? 0,
    },
  };
}

async function verifyBeforeStore(
  opportunities: Opportunity[],
  totalBudgetMs: number
): Promise<VerificationOutcome> {
  const stats: VerificationOutcome['stats'] = {
    ok: 0, dead: 0, soft_404: 0, redirected_generic: 0,
    auth_required: 0, server_error: 0, timeout: 0,
    inconclusive: 0, invalid_url: 0, unverified: 0,
  };
  if (opportunities.length === 0) return { kept: [], rejected: [], stats };

  const urls = opportunities.map((o) => o.url).filter(Boolean);
  const results = await verifyOpportunityLinks(urls, {
    concurrency: 10,
    perUrlBudgetMs: 7_000,
    totalBudgetMs,
  });
  const byUrl = new Map<string, LinkVerificationResult>();
  for (const r of results) byUrl.set(r.url, r);

  const kept: Opportunity[] = [];
  const rejected: { opp: Opportunity; result: LinkVerificationResult }[] = [];
  for (const opp of opportunities) {
    const result = byUrl.get(opp.url);
    if (!result) {
      stats.unverified++;
      kept.push(applyValidation(opp, null));
      continue;
    }
    stats[result.verdict]++;
    if (REJECT_VERDICTS.has(result.verdict)) {
      rejected.push({ opp, result });
      continue;
    }
    kept.push(applyValidation(opp, result));
  }
  return { kept, rejected, stats };
}

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

    // Pre-storage link verification — block dead/soft-404/generic-redirect URLs
    // from ever entering the catalogue.
    let verificationStats: VerificationOutcome['stats'] = {
      ok: 0, dead: 0, soft_404: 0, redirected_generic: 0,
      auth_required: 0, server_error: 0, timeout: 0,
      inconclusive: 0, invalid_url: 0, unverified: 0,
    };
    let rejectedSample: { url: string; verdict: LinkVerdict; reason: string | null }[] = [];
    let toStore: Opportunity[] = normalizedOpportunities;
    try {
      const verification = await verifyBeforeStore(normalizedOpportunities, 40_000);
      verificationStats = verification.stats;
      rejectedSample = verification.rejected.slice(0, 25).map(({ opp, result }) => ({
        url: opp.url,
        verdict: result.verdict,
        reason: result.reason,
      }));
      toStore = verification.kept;
      console.log(
        `[Ingest] Verification: kept ${verification.kept.length}, rejected ${verification.rejected.length}`
      );
    } catch (verifyErr) {
      console.warn(
        '[Ingest] Verification failed (non-fatal, storing unverified):',
        verifyErr instanceof Error ? verifyErr.message : verifyErr
      );
    }

    const storeResult = await storeOpportunities(toStore);
    console.log(`[Ingest] Stored: ${storeResult.added} new, ${storeResult.updated} updated`);

    const linksChecked = normalizedOpportunities.length;
    const deadLinks =
      verificationStats.dead +
      verificationStats.soft_404 +
      verificationStats.redirected_generic +
      verificationStats.invalid_url;

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
        verification: verificationStats,
        rejectedSample,
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

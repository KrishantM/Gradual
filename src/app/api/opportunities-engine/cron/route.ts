import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../../lib/firebase-admin';
import { runAllConnectors } from '@/lib/opportunities-engine/connectors';
import { Opportunity } from '@/types/opportunities';
import {
  normalizeUrl,
  verifyOpportunityLinks,
  type LinkVerdict,
  type LinkVerificationResult,
} from '@/lib/opportunities-engine/link-validator';

// Verdicts that should keep an opportunity out of the engine entirely.
const REJECT_VERDICTS: ReadonlySet<LinkVerdict> = new Set<LinkVerdict>([
  'dead',
  'soft_404',
  'redirected_generic',
  'invalid_url',
]);

// Verdicts that don't disqualify a link but should be flagged for review.
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

/**
 * Run link verification on every fresh opportunity and split them into the
 * ones we trust enough to store and the ones we drop. Updated/refreshed
 * opportunities (those with a matching id already in Firestore) skip the
 * deeper body check to keep the cron under its time budget — they were
 * verified the first time they were ingested.
 */
async function verifyBeforeStore(
  opportunities: Opportunity[],
  totalBudgetMs: number
): Promise<VerificationOutcome> {
  const stats: VerificationOutcome['stats'] = {
    ok: 0,
    dead: 0,
    soft_404: 0,
    redirected_generic: 0,
    auth_required: 0,
    server_error: 0,
    timeout: 0,
    inconclusive: 0,
    invalid_url: 0,
    unverified: 0,
  };

  if (opportunities.length === 0) {
    return { kept: [], rejected: [], stats };
  }

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
      // No URL or no result — keep it but flag.
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
  if (FLAG_VERDICTS.has(result.verdict)) {
    flags.push(`link_${result.verdict}`);
  }

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

const BATCH_SIZE = 450;

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

// Firestore caps the `in` operator at 30 values per query.
const IN_QUERY_LIMIT = 30;

async function storeOpportunities(opportunities: Opportunity[]): Promise<{ added: number; updated: number }> {
  let added = 0;
  let updated = 0;
  const opportunitiesRef = db.collection('opportunities');

  for (let i = 0; i < opportunities.length; i += BATCH_SIZE) {
    const chunk = opportunities.slice(i, i + BATCH_SIZE);

    // Resolve existing docs for the whole chunk up-front via batched `in` queries —
    // avoids N+1 round-trips that previously blew past the Vercel cron timeout.
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

async function cleanupStaleOpportunities(): Promise<number> {
  const opportunitiesRef = db.collection('opportunities');
  const now = new Date();
  let cleaned = 0;

  // Expire past-deadline opportunities
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

  // Purge opportunities expired >90 days ago
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffStr = cutoff.toISOString();

  const expiredQuery = await opportunitiesRef
    .where('status', '==', 'expired')
    .limit(200)
    .get();

  if (!expiredQuery.empty) {
    const batch = db.batch();
    let purged = 0;
    for (const doc of expiredQuery.docs) {
      const data = doc.data();
      const updatedAt = data.updatedAt || data.ingestedAt || data.createdAt || '';
      if (updatedAt && updatedAt < cutoffStr) {
        batch.delete(doc.ref);
        purged++;
      }
    }
    if (purged > 0) {
      await batch.commit();
      cleaned += purged;
    }
  }

  return cleaned;
}

/**
 * Cron-compatible endpoint for scheduled opportunity ingestion.
 * Authenticates via CRON_SECRET header — no user auth needed.
 * Compatible with Vercel Cron, GitHub Actions, or any HTTP scheduler.
 *
 * Recommended schedule: every 6 hours.
 * Set CRON_SECRET in environment variables.
 */
export async function GET(req: NextRequest) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');

  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    console.log('[Cron] Starting scheduled opportunity ingestion...');

    // Run all connectors without user profile (weekly deep refresh)
    const ingestionResult = await runAllConnectors({ maxResults: 800 });

    console.log(`[Cron] Fetched ${ingestionResult.totalFetched}, validated ${ingestionResult.totalValidated}, deduplicated to ${ingestionResult.totalDeduplicated}, fresh: ${ingestionResult.totalFresh}`);

    // Normalize URLs
    const normalizedOpportunities = ingestionResult.opportunities.map(opp => ({
      ...opp,
      url: normalizeUrl(opp.url),
      canonicalUrl: opp.canonicalUrl ? normalizeUrl(opp.canonicalUrl) : undefined,
    }));

    // Verify links BEFORE storage so dead, soft-404, and generic-redirect
    // URLs never enter the engine in the first place.
    let verificationStats: VerificationOutcome['stats'] = {
      ok: 0, dead: 0, soft_404: 0, redirected_generic: 0,
      auth_required: 0, server_error: 0, timeout: 0,
      inconclusive: 0, invalid_url: 0, unverified: 0,
    };
    let rejectedSample: { url: string; verdict: LinkVerdict; reason: string | null }[] = [];
    let toStore: Opportunity[] = normalizedOpportunities;
    try {
      const verification = await verifyBeforeStore(normalizedOpportunities, 45_000);
      verificationStats = verification.stats;
      rejectedSample = verification.rejected.slice(0, 25).map(({ opp, result }) => ({
        url: opp.url,
        verdict: result.verdict,
        reason: result.reason,
      }));
      toStore = verification.kept;
      console.log(
        `[Cron] Verification: kept ${verification.kept.length}, rejected ${verification.rejected.length} ` +
          `(dead:${verificationStats.dead}, soft_404:${verificationStats.soft_404}, ` +
          `redirected:${verificationStats.redirected_generic}, invalid:${verificationStats.invalid_url})`
      );
    } catch (verifyErr) {
      console.warn(
        '[Cron] Link verification failed (non-fatal, storing unverified):',
        verifyErr instanceof Error ? verifyErr.message : verifyErr
      );
    }

    // Store in Firestore (only verified-or-inconclusive opportunities).
    const storeResult = await storeOpportunities(toStore);
    console.log(`[Cron] Stored: ${storeResult.added} new, ${storeResult.updated} updated`);

    const linksChecked = normalizedOpportunities.length;
    const deadLinks =
      verificationStats.dead +
      verificationStats.soft_404 +
      verificationStats.redirected_generic +
      verificationStats.invalid_url;

    // Cleanup stale opportunities
    let cleaned = 0;
    try {
      cleaned = await cleanupStaleOpportunities();
      console.log(`[Cron] Cleaned ${cleaned} stale opportunities`);
    } catch (cleanupErr) {
      console.warn('[Cron] Cleanup failed (non-fatal):', cleanupErr instanceof Error ? cleanupErr.message : cleanupErr);
    }

    const durationMs = Date.now() - startTime;

    // Write last-refresh timestamp for the UI
    try {
      await db.collection('opportunities_meta').doc('last_refresh').set({
        refreshedAt: new Date().toISOString(),
        totalStored: storeResult.added + storeResult.updated,
      });
    } catch { /* non-fatal */ }

    // Log run to Firestore for observability
    try {
      await db.collection('system_logs').add({
        type: 'cron_ingestion',
        timestamp: new Date().toISOString(),
        durationMs,
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
        },
        errors: ingestionResult.errors.length > 0 ? ingestionResult.errors : null,
      });
    } catch {
      // Non-fatal: logging failure shouldn't break the cron
    }

    return NextResponse.json({
      success: true,
      durationMs,
      stats: {
        fetched: ingestionResult.totalFetched,
        validated: ingestionResult.totalValidated,
        stored: storeResult.added,
        updated: storeResult.updated,
        cleaned,
        linksChecked,
        deadLinks,
        verification: verificationStats,
      },
    });
  } catch (error) {
    console.error('[Cron] Ingestion failed:', error);
    return NextResponse.json(
      { error: 'Cron ingestion failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../../lib/firebase-admin';
import { runAllConnectors } from '@/lib/opportunities-engine/connectors';
import { Opportunity } from '@/types/opportunities';
import { validateLinks, normalizeUrl } from '@/lib/opportunities-engine/link-validator';

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

    // Store in Firestore
    const storeResult = await storeOpportunities(normalizedOpportunities);
    console.log(`[Cron] Stored: ${storeResult.added} new, ${storeResult.updated} updated`);

    // Link validation on a sample
    let linksChecked = 0;
    let deadLinks = 0;
    try {
      const urlsToCheck = normalizedOpportunities
        .slice(0, 30)
        .map(opp => opp.url);

      const linkResults = await validateLinks(urlsToCheck, 3);
      linksChecked = linkResults.length;
      const deadResults = linkResults.filter(r => !r.isValid);
      deadLinks = deadResults.length;

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
              status: 'expired',
            });
          }
        }
        console.log(`[Cron] Flagged ${deadLinks} dead links`);
      }
    } catch (linkErr) {
      console.warn('[Cron] Link validation failed (non-fatal):', linkErr instanceof Error ? linkErr.message : linkErr);
    }

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

/**
 * Opportunity Ingestion Script
 *
 * Run with: npx tsx scripts/ingest-opportunities.ts
 *
 * Fetches opportunities from all connectors, validates, deduplicates,
 * and stores them in Firestore.
 *
 * Environment variables required:
 * - FIREBASE_SERVICE_ACCOUNT_KEY (JSON string)
 * - ADZUNA_APP_ID
 * - ADZUNA_APP_KEY
 */

import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    console.error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required');
    process.exit(1);
  }
  // trim() strips a leading BOM (U+FEFF) / stray whitespace that dashboard-pasted
  // env values can carry, which would otherwise make JSON.parse throw.
  const serviceAccount = JSON.parse(serviceAccountKey.trim());
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

async function main() {
  console.log('=== Gradual Opportunity Ingestion ===');
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log('');

  const { runAllConnectors } = await import('../src/lib/opportunities-engine/connectors/index');

  console.log('Running all connectors...');
  const result = await runAllConnectors({ maxResults: 50 });

  console.log(`\nIngestion complete:`);
  console.log(`  Total fetched:      ${result.totalFetched}`);
  console.log(`  Total validated:    ${result.totalValidated}`);
  console.log(`  Total deduplicated: ${result.totalDeduplicated}`);
  console.log(`  Total fresh:        ${result.totalFresh}`);
  console.log(`  Duration:           ${result.durationMs}ms`);
  console.log('');

  console.log('By source:');
  for (const [source, stats] of Object.entries(result.bySource)) {
    console.log(`  ${source}: fetched=${stats.fetched}, validated=${stats.validated}`);
    if (stats.errors.length > 0) {
      console.log(`    errors: ${stats.errors.join(', ')}`);
    }
  }
  console.log('');

  if (result.errors.length > 0) {
    console.log('Errors:');
    for (const err of result.errors) {
      console.log(`  - ${err}`);
    }
    console.log('');
  }

  function deepCleanValue(val: unknown): unknown {
    if (val === undefined || val === null) return null;
    if (Array.isArray(val)) return val.filter(v => v !== undefined).map(deepCleanValue);
    if (typeof val === 'object' && val !== null) {
      const c: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(val)) { if (v !== undefined) c[k] = deepCleanValue(v); }
      return c;
    }
    return val;
  }

  console.log(`Storing ${result.opportunities.length} opportunities in Firestore...`);
  const opportunitiesRef = db.collection('opportunities');
  let added = 0;
  let updated = 0;
  const BATCH_SIZE = 450;

  for (let i = 0; i < result.opportunities.length; i += BATCH_SIZE) {
    const chunk = result.opportunities.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    for (const opp of chunk) {
      const existingQuery = await opportunitiesRef.where('id', '==', opp.id).limit(1).get();
      const docData: Record<string, any> = {};
      for (const [key, value] of Object.entries(opp)) {
        if (value === undefined || key === 'rawSourceData') continue;
        docData[key] = deepCleanValue(value);
      }

      if (existingQuery.empty) {
        batch.set(opportunitiesRef.doc(), { ...docData, ingestedAt: new Date().toISOString() });
        added++;
      } else {
        batch.update(existingQuery.docs[0].ref, { ...docData, updatedAt: new Date().toISOString() });
        updated++;
      }
    }
    await batch.commit();
  }

  console.log(`  Added: ${added}`);
  console.log(`  Updated: ${updated}`);

  console.log('\nCleaning up stale opportunities...');
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const staleQuery = await opportunitiesRef.where('status', '==', 'expired').limit(200).get();
  if (!staleQuery.empty) {
    const batch = db.batch();
    staleQuery.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log(`  Deleted ${staleQuery.docs.length} expired opportunities`);
  } else {
    console.log('  No stale opportunities to clean');
  }

  console.log(`\nFinished at: ${new Date().toISOString()}`);
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

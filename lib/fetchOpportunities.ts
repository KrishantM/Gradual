import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import serviceAccount from './firebase-service-account.json';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fetch from 'node-fetch';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount as any),
  });
}

const db = getFirestore();

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID!;
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY!;
const COUNTRY = 'gb';

// Keywords and Locations to loop through
const KEYWORDS = ['intern', 'graduate'];
const LOCATIONS = ['Auckland', 'Wellington', 'Christchurch'];

async function fetchAdzunaJobs(
  query: string,
  location: string,
  resultsPerPage: number
) {
  const url = `https://api.adzuna.com/v1/api/jobs/${COUNTRY}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=${resultsPerPage}&what=${encodeURIComponent(
    query
  )}${location ? `&where=${encodeURIComponent(location)}` : ''}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${query} jobs in ${location}`);
  const data = await res.json();
  return data.results;
}

function normalizeAdzunaJob(job: any) {
  return {
    source: 'adzuna',
    type: job.category?.label?.toLowerCase().includes('intern')
      ? 'internship'
      : 'job',
    title: job.title,
    description: job.description,
    location: job.location?.display_name || '',
    company: job.company?.display_name || '',
    url: job.redirect_url,
    created: job.created,
    salary_min: job.salary_min ?? null,
    salary_max: job.salary_max ?? null,
    category: job.category?.label || '',
    id: job.id,
    fetchedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
  };
}

async function storeOpportunities(opportunities: any[]) {
  const batch = db.batch();
  opportunities.forEach((opp) => {
    const ref = db.collection('opportunities').doc(opp.id);
    batch.set(ref, opp, { merge: true });
  });
  await batch.commit();
}

export async function fetchAndStoreAdzunaOpportunities() {
  try {
    let allJobs: any[] = [];

    for (const keyword of KEYWORDS) {
      for (const location of LOCATIONS) {
        console.log(`Fetching jobs for "${keyword}" in "${location}"...`);
        const jobs = await fetchAdzunaJobs(keyword, location, 30);
        const normalized = jobs.map(normalizeAdzunaJob);
        allJobs.push(...normalized);
        console.log(`→ Added ${normalized.length} jobs.`);
      }
    }

    await storeOpportunities(allJobs);
    console.log(`✅ Stored ${allJobs.length} total Adzuna opportunities.`);
  } catch (err) {
    console.error('❌ Error fetching/storing Adzuna opportunities:', err);
  }
}

if (require.main === module) {
  fetchAndStoreAdzunaOpportunities();
}

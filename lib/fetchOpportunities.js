require('dotenv').config({ path: '.env.local' });
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fetch = require('node-fetch');

// Initialize Firebase Admin SDK (ensure you have service account credentials in your env)
if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
  });
}
const db = getFirestore();

// Adzuna API credentials from environment variables
const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;
const COUNTRY = 'gb'; // Change as needed

// Fetch jobs/internships from Adzuna
async function fetchAdzunaJobs(query = 'intern', location = '', resultsPerPage = 20) {
  const url = `https://api.adzuna.com/v1/api/jobs/${COUNTRY}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=${resultsPerPage}&what=${encodeURIComponent(query)}${location ? `&where=${encodeURIComponent(location)}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch from Adzuna');
  const data = await res.json();
  return data.results;
}

// Normalize Adzuna job data to our Firestore schema
function normalizeAdzunaJob(job) {
  return {
    source: 'adzuna',
    type: job.category && job.category.label && job.category.label.toLowerCase().includes('intern') ? 'internship' : 'job',
    title: job.title,
    description: job.description,
    location: job.location.display_name,
    company: job.company && job.company.display_name ? job.company.display_name : '',
    url: job.redirect_url,
    created: job.created,
    salary_min: job.salary_min,
    salary_max: job.salary_max,
    category: job.category && job.category.label ? job.category.label : '',
    id: job.id,
    fetchedAt: new Date().toISOString(),
  };
}

// Store opportunities in Firestore
async function storeOpportunities(opportunities) {
  const batch = db.batch();
  opportunities.forEach((opp) => {
    const ref = db.collection('opportunities').doc(opp.id);
    batch.set(ref, opp, { merge: true });
  });
  await batch.commit();
}

// Main function to fetch and store Adzuna jobs/internships
async function fetchAndStoreAdzunaOpportunities() {
  try {
    const jobs = await fetchAdzunaJobs('intern', '', 30); // You can adjust query/params
    const normalized = jobs.map(normalizeAdzunaJob);
    await storeOpportunities(normalized);
    console.log(`Stored ${normalized.length} Adzuna opportunities.`);
  } catch (err) {
    console.error('Error fetching/storing Adzuna opportunities:', err);
  }
}

// Run manually if called directly
if (require.main === module) {
  fetchAndStoreAdzunaOpportunities();
} 

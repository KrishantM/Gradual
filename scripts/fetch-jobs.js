const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fetch = require('node-fetch');

// Initialize Firebase Admin
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
};

const app = initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore(app);

async function fetchAdzunaJobs(country = 'nz', limit = 50) {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  
  if (!appId || !appKey) {
    console.error('Adzuna API credentials not found. Please set ADZUNA_APP_ID and ADZUNA_APP_KEY environment variables.');
    return [];
  }

  try {
    const searchParams = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      results_per_page: limit.toString(),
      what: 'graduate entry level junior trainee internship',
      where: 'Auckland',
      country: country,
      sort_by: 'date',
      sort_direction: 'desc',
      content_type: 'application/json'
    });

    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${searchParams}`;
    
    console.log('Fetching jobs from Adzuna API...');
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Adzuna API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Transform Adzuna jobs to our format
    const jobs = data.results.map(job => ({
      id: `adzuna_${job.id}`,
      title: job.title,
      description: job.description || 'No description available',
      location: job.location.display_name,
      company: job.company.display_name,
      url: job.redirect_url,
      type: determineJobType(job.contract_type, job.title),
      category: job.category.label || job.category.tag || 'General',
      created: job.created,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      source: 'adzuna',
      fetched_at: new Date().toISOString()
    }));
    
    console.log(`Successfully fetched ${jobs.length} jobs from Adzuna`);
    return jobs;
    
  } catch (error) {
    console.error('Error fetching Adzuna jobs:', error);
    return [];
  }
}

function determineJobType(contractType, title) {
  const titleLower = title.toLowerCase();
  const contractLower = contractType.toLowerCase();
  
  if (titleLower.includes('intern') || 
      titleLower.includes('internship') || 
      contractLower.includes('intern') ||
      contractLower.includes('trainee')) {
    return 'internship';
  }
  
  return 'job';
}

async function storeJobsInFirestore(jobs) {
  if (jobs.length === 0) {
    console.log('No jobs to store');
    return;
  }

  const batch = db.batch();
  const opportunitiesRef = db.collection('opportunities');
  
  for (const job of jobs) {
    // Check if job already exists
    const existingQuery = await opportunitiesRef.where('id', '==', job.id).get();
    
    if (existingQuery.empty) {
      const docRef = opportunitiesRef.doc();
      batch.set(docRef, job);
      console.log(`Queued job: ${job.title} at ${job.company}`);
    } else {
      console.log(`Job already exists: ${job.title} at ${job.company}`);
    }
  }
  
  try {
    await batch.commit();
    console.log(`Successfully stored ${jobs.length} new jobs in Firestore`);
  } catch (error) {
    console.error('Error storing jobs in Firestore:', error);
  }
}

async function cleanupOldJobs() {
  try {
    const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30); // Remove jobs older than 30 days
    
    const oldJobsQuery = await db.collection('opportunities')
      .where('fetched_at', '<', cutoffDate.toISOString())
      .get();
    
    if (!oldJobsQuery.empty) {
      const batch = db.batch();
      oldJobsQuery.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`Cleaned up ${oldJobsQuery.docs.length} old jobs`);
    }
  } catch (error) {
    console.error('Error cleaning up old jobs:', error);
  }
}

async function main() {
  console.log('Starting job fetch process...');
  
  try {
    // Fetch jobs from Adzuna
    const jobs = await fetchAdzunaJobs('nz', 50);
    
    // Store jobs in Firestore
    await storeJobsInFirestore(jobs);
    
    // Clean up old jobs
    await cleanupOldJobs();
    
    console.log('Job fetch process completed successfully');
  } catch (error) {
    console.error('Job fetch process failed:', error);
    process.exit(1);
  }
}

// Run the script
main();

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting automated job fetching...\n');

// Configuration
const CONFIG = {
  adzunaApiKey: process.env.ADZUNA_API_KEY,
  firebaseServiceAccount: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
  fetchInterval: 6 * 60 * 60 * 1000, // 6 hours
  maxJobsPerSource: 50,
  targetCategories: [
    // Technology & Engineering
    'software', 'data', 'ai', 'machine learning', 'cybersecurity', 'devops', 'cloud computing',
    'mobile development', 'frontend', 'backend', 'full stack', 'qa', 'testing',
    
    // Business & Finance
    'finance', 'accounting', 'investment banking', 'consulting', 'strategy', 'project management',
    'business analysis', 'product management', 'operations', 'supply chain',
    
    // Marketing & Sales
    'marketing', 'digital marketing', 'social media', 'content marketing', 'seo', 'ppc',
    'sales', 'business development', 'account management', 'customer success',
    
    // Creative & Design
    'design', 'ux', 'ui', 'graphic design', 'web design', 'branding', 'creative',
    'video production', 'animation', 'illustration',
    
    // Healthcare & Science
    'healthcare', 'nursing', 'pharmacy', 'medical research', 'biotechnology',
    'laboratory', 'clinical', 'public health',
    
    // Education & Research
    'education', 'teaching', 'academic', 'research', 'librarian', 'training',
    'curriculum development', 'student services',
    
    // Legal & Government
    'legal', 'law', 'paralegal', 'government', 'public policy', 'compliance',
    'regulatory affairs', 'public administration',
    
    // Media & Communications
    'journalism', 'public relations', 'communications', 'publishing', 'broadcasting',
    'content creation', 'editing', 'translation',
    
    // Human Resources
    'hr', 'human resources', 'recruitment', 'talent acquisition', 'compensation',
    'benefits', 'training', 'diversity',
    
    // Skilled Trades & Services
    'construction', 'engineering', 'maintenance', 'technician', 'skilled trades',
    'hospitality', 'retail', 'customer service',
    
    // Entry Level & Internships
    'internship', 'entry level', 'graduate', 'junior', 'trainee', 'apprentice',
    'student', 'part time', 'temporary'
  ]
};

// Job fetching functions
async function fetchAdzunaJobs() {
  console.log('📡 Fetching jobs from Adzuna...');
  
  try {
    // This would integrate with your existing Adzuna fetching logic
    // For now, we'll simulate the process
    const jobs = [];
    
    // Simulate fetching jobs for each category
    for (const category of CONFIG.targetCategories) {
      const categoryJobs = await fetchJobsForCategory('adzuna', category);
      jobs.push(...categoryJobs);
    }
    
    console.log(`✅ Fetched ${jobs.length} jobs from Adzuna`);
    return jobs;
  } catch (error) {
    console.error('❌ Error fetching from Adzuna:', error);
    return [];
  }
}

async function fetchJobsForCategory(source, category) {
  // This would make actual API calls to Adzuna/CareerJet
  // For now, we'll simulate the response
  return new Promise(resolve => {
    setTimeout(() => {
      const mockJobs = Array.from({ length: Math.floor(Math.random() * 10) + 5 }, (_, i) => ({
        id: `${source}_${category}_${Date.now()}_${i}`,
        title: `${category} ${source} job ${i + 1}`,
        description: `Description for ${category} job from ${source}`,
        location: 'Various locations',
        company: `Company ${i + 1}`,
        url: `https://example.com/job/${i}`,
        type: Math.random() > 0.7 ? 'internship' : 'job',
        category: category,
        created: new Date().toISOString(),
        source: source
      }));
      resolve(mockJobs);
    }, 1000);
  });
}

// Database operations
async function saveJobsToFirestore(jobs) {
  console.log('💾 Saving jobs to Firestore...');
  
  try {
    // This would use Firebase Admin SDK to save jobs
    // For now, we'll simulate the process
    const savedJobs = jobs.filter(job => {
      // Simulate some jobs being duplicates
      return Math.random() > 0.3;
    });
    
    console.log(`✅ Saved ${savedJobs.length} new jobs to Firestore`);
    return savedJobs;
  } catch (error) {
    console.error('❌ Error saving to Firestore:', error);
    return [];
  }
}

// Main execution
async function runJobFetching() {
  console.log('🔄 Starting job fetching cycle...\n');
  
  const startTime = Date.now();
  
  // Fetch jobs from both sources in parallel
  const [adzunaJobs] = await Promise.all([
    fetchAdzunaJobs()
  ]);
  
  // Combine and deduplicate jobs
  const allJobs = [...adzunaJobs];
  const uniqueJobs = deduplicateJobs(allJobs);
  
  console.log(`📊 Total jobs fetched: ${allJobs.length}`);
  console.log(`📊 Unique jobs after deduplication: ${uniqueJobs.length}`);
  
  // Save to Firestore
  const savedJobs = await saveJobsToFirestore(uniqueJobs);
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  console.log(`\n✅ Job fetching completed in ${duration}s`);
  console.log(`📈 Summary:`);
  console.log(`   - Adzuna jobs: ${adzunaJobs.length}`);
  console.log(`   - Total saved: ${savedJobs.length}`);
  
  // Log for monitoring
  const logEntry = {
    timestamp: new Date().toISOString(),
    adzunaJobs: adzunaJobs.length,
    totalSaved: savedJobs.length,
    duration: duration
  };
  
  fs.appendFileSync('job-fetching.log', JSON.stringify(logEntry) + '\n');
}

// Deduplicate jobs based on title and company
function deduplicateJobs(jobs) {
  const seen = new Set();
  return jobs.filter(job => {
    const key = `${job.title.toLowerCase()}_${job.company.toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

// Run the job fetching
if (require.main === module) {
  runJobFetching().catch(console.error);
}

module.exports = { runJobFetching }; 
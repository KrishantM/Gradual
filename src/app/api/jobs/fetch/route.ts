import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../lib/firebase-admin';
import { fetchAdzunaJobs } from '../../../../../lib/opportunityFetchers/adzuna';
import { db } from '../../../../../lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the Firebase token
    try {
      const decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    const { limit = 20, country = 'nz' } = await req.json();
    
    console.log('Fetching new jobs from Adzuna...');
    
    // Fetch jobs from Adzuna
    const jobs = await fetchAdzunaJobs({}, limit, country);
    
    if (jobs.length === 0) {
      return NextResponse.json({ 
        message: 'No new jobs found',
        jobsAdded: 0,
        totalJobs: 0
      });
    }
    
    // Store new jobs in Firestore
    const batch = db.batch();
    const opportunitiesRef = db.collection('opportunities');
    let newJobsCount = 0;
    
    for (const job of jobs) {
      // Check if job already exists
      const existingQuery = await opportunitiesRef.where('id', '==', job.id).get();
      
      if (existingQuery.empty) {
        const docRef = opportunitiesRef.doc();
        
        // Filter out undefined values to avoid Firestore errors
        const jobData = {
          id: job.id,
          title: job.title,
          description: job.description,
          location: job.location,
          company: job.company,
          url: job.url,
          type: job.type,
          category: job.category,
          created: job.created,
          source: job.source,
          fetched_at: new Date().toISOString()
        };
        
        // Only add salary fields if they have values
        if (job.salary_min !== undefined && job.salary_min !== null) {
          jobData.salary_min = job.salary_min;
        }
        if (job.salary_max !== undefined && job.salary_max !== null) {
          jobData.salary_max = job.salary_max;
        }
        
        batch.set(docRef, jobData);
        newJobsCount++;
      }
    }
    
    if (newJobsCount > 0) {
      await batch.commit();
      console.log(`Successfully stored ${newJobsCount} new jobs in Firestore`);
    }
    
    return NextResponse.json({
      message: `Successfully fetched and stored ${newJobsCount} new jobs`,
      jobsAdded: newJobsCount,
      totalJobs: jobs.length,
      source: 'adzuna'
    });
    
  } catch (error) {
    console.error('Job fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../lib/firebase-admin';

interface UnifiedJob {
  id: string;
  title: string;
  description: string;
  location: string;
  company: string;
  url: string;
  type: 'internship' | 'job';
  category: string;
  created: string;
  salary_min?: number;
  salary_max?: number;
  source: 'adzuna';
  score?: number;
}

interface JobSource {
  name: 'adzuna';
  fetchJobs: (profile: any, limit: number) => Promise<UnifiedJob[]>;
}

export async function GET(req: NextRequest) {
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

    // For GET requests, we'll fetch jobs without profile-based filtering
    const limit = 20;

    // Define job sources - only Adzuna for now
    const jobSources: JobSource[] = [
      {
        name: 'adzuna',
        fetchJobs: fetchAdzunaJobs
      }
    ];

    // Fetch jobs from all sources in parallel
    const jobPromises = jobSources.map(source => 
      source.fetchJobs({}, Math.ceil(limit / jobSources.length))
        .catch(error => {
          console.error(`Error fetching from ${source.name}:`, error);
          return [];
        })
    );

    const jobResults = await Promise.all(jobPromises);
    
    // Combine and deduplicate jobs
    const allJobs = jobResults.flat();
    const uniqueJobs = deduplicateJobs(allJobs);
    
    // For GET requests, return jobs without scoring
    const topJobs = uniqueJobs.slice(0, limit);

    return NextResponse.json({
      opportunities: topJobs,
      totalJobs: uniqueJobs.length,
      sources: jobSources.map(s => s.name)
    });

  } catch (error) {
    console.error('Unified job fetching error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

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

    const { profile, limit = 20 } = await req.json();
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile is required' }, { status: 400 });
    }

    // Define job sources - only Adzuna for now
    const jobSources: JobSource[] = [
      {
        name: 'adzuna',
        fetchJobs: fetchAdzunaJobs
      }
    ];

    // Fetch jobs from all sources in parallel
    const jobPromises = jobSources.map(source => 
      source.fetchJobs(profile, Math.ceil(limit / jobSources.length))
        .catch(error => {
          console.error(`Error fetching from ${source.name}:`, error);
          return [];
        })
    );

    const jobResults = await Promise.all(jobPromises);
    
    // Combine and deduplicate jobs
    const allJobs = jobResults.flat();
    const uniqueJobs = deduplicateJobs(allJobs);
    
    // Score and sort jobs
    const scoredJobs = scoreJobs(uniqueJobs, profile);
    const topJobs = scoredJobs
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, limit);

    return NextResponse.json({
      opportunities: topJobs,
      totalJobs: uniqueJobs.length,
      sources: jobSources.map(s => s.name),
      topScored: topJobs.length
    });

  } catch (error) {
    console.error('Unified job fetching error:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

// Fetch jobs from Adzuna (existing Firestore data)
async function fetchAdzunaJobs(profile: any, limit: number): Promise<UnifiedJob[]> {
  try {
    // Import the database directly
    const { db } = await import('@/lib/firebase-admin');
    
    // Fetch opportunities from Firestore
    const opportunitiesRef = db.collection('opportunities');
    const q = opportunitiesRef.orderBy('created', 'desc').limit(100);
    
    const querySnapshot = await q.get();
    const opportunities: any[] = [];
    
    querySnapshot.forEach((doc: any) => {
      opportunities.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // If no opportunities in database, return mock data for testing
    if (opportunities.length === 0) {
      const mockOpportunities = [
        {
          id: 'mock-1',
          title: 'Software Engineer',
          description: 'We are looking for a talented software engineer to join our team. Experience with React, Node.js, and cloud platforms preferred.',
          location: 'Auckland, NZ',
          company: 'TechCorp',
          url: 'https://example.com/job1',
          type: 'job' as const,
          category: 'Technology',
          created: new Date().toISOString(),
          source: 'adzuna'
        },
        {
          id: 'mock-2',
          title: 'Data Analyst Intern',
          description: 'Join our data team and learn about analytics, machine learning, and business intelligence.',
          location: 'Wellington, NZ',
          company: 'DataFlow',
          url: 'https://example.com/job2',
          type: 'internship' as const,
          category: 'Data',
          created: new Date().toISOString(),
          source: 'adzuna'
        },
        {
          id: 'mock-3',
          title: 'Marketing Coordinator',
          description: 'Help us grow our brand through digital marketing, social media, and content creation.',
          location: 'Christchurch, NZ',
          company: 'GrowthMarketing',
          url: 'https://example.com/job3',
          type: 'job' as const,
          category: 'Marketing',
          created: new Date().toISOString(),
          source: 'adzuna'
        }
      ];
      
      return mockOpportunities.map(job => ({
        ...job,
        source: 'adzuna' as const
      }));
    }
    
    return opportunities.map((job: any) => ({
      ...job,
      type: job.type as 'internship' | 'job',
      source: 'adzuna' as const
    }));
  } catch (error) {
    console.error('Adzuna fetch error:', error);
    return [];
  }
}

// Deduplicate jobs based on title and company
function deduplicateJobs(jobs: UnifiedJob[]): UnifiedJob[] {
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

// Score jobs based on profile match
function scoreJobs(jobs: UnifiedJob[], profile: any): UnifiedJob[] {
  return jobs.map(job => {
    const score = calculateJobScore(job, profile);
    return { ...job, score };
  });
}

// Calculate job score based on profile match
function calculateJobScore(job: UnifiedJob, profile: any): number {
  let score = 0;
  
  // Keyword matching (40% weight)
  const jobText = `${job.title} ${job.description}`.toLowerCase();
  const profileText = `${profile.degree} ${profile.interests} ${profile.preferredIndustries}`.toLowerCase();
  
  const keywords = profileText.split(/\s+/).filter(word => word.length > 3);
  const matches = keywords.filter(keyword => jobText.includes(keyword));
  score += (matches.length / keywords.length) * 40;
  
  // Location matching (30% weight)
  const jobLocation = job.location.toLowerCase();
  const userLocation = `${profile.city} ${profile.country}`.toLowerCase();
  
  if (jobLocation.includes(profile.city?.toLowerCase() || '')) {
    score += 30;
  } else if (jobLocation.includes(profile.country?.toLowerCase() || '')) {
    score += 20;
  } else if (jobLocation.includes('remote')) {
    score += 15;
  }
  
  // Job type matching (20% weight)
  const isStudent = profile.university && profile.degree;
  if ((isStudent && job.type === 'internship') || (!isStudent && job.type === 'job')) {
    score += 20;
  } else {
    score += 10;
  }
  
  // Recency (10% weight)
  const daysOld = (Date.now() - new Date(job.created).getTime()) / (1000 * 60 * 60 * 24);
  if (daysOld <= 7) score += 10;
  else if (daysOld <= 30) score += 7;
  else if (daysOld <= 60) score += 5;
  else score += 2;
  
  return Math.round(score);
} 
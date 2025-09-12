interface AdzunaJob {
  id: string;
  title?: string;
  description?: string;
  location?: {
    display_name?: string;
    area?: string[];
  };
  company?: {
    display_name?: string;
  };
  redirect_url?: string;
  contract_type?: string;
  salary_min?: number;
  salary_max?: number;
  created?: string;
  category?: {
    tag?: string;
    label?: string;
  };
}

interface AdzunaResponse {
  results: AdzunaJob[];
  count: number;
}

export interface UnifiedJob {
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

export async function fetchAdzunaJobs(
  profile: any, 
  limit: number = 20,
  country: string = 'nz'
): Promise<UnifiedJob[]> {
  try {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    
    if (!appId || !appKey) {
      console.warn('Adzuna API credentials not found. Using mock data.');
      return getMockAdzunaJobs(limit);
    }

    const location = profile?.city || 'Auckland';
    
    // Try multiple search queries if the first one returns no results
    const searchQueries = [
      buildSearchQuery(profile),
      'graduate',
      'entry level',
      'junior',
      'internship',
      'jobs'
    ];
    
    for (let i = 0; i < searchQueries.length; i++) {
      const searchQuery = searchQueries[i];
      
      const searchParams = new URLSearchParams({
        app_id: appId,
        app_key: appKey,
        results_per_page: limit.toString(),
        what: searchQuery,
        where: location,
        sort_by: 'date'
      });

      const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${searchParams}`;
      
      console.log(`Fetching jobs from Adzuna API (attempt ${i + 1}/${searchQueries.length})...`);
      console.log('Search query:', searchQuery);
      console.log('Location:', location);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Gradual-App/1.0'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Adzuna API error response:', errorText);
        throw new Error(`Adzuna API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data: AdzunaResponse = await response.json();
      
      // If we got results, use them; otherwise try the next query
      if (data.results && data.results.length > 0) {
        // Transform Adzuna jobs to unified format
        const unifiedJobs: UnifiedJob[] = data.results.map((job: AdzunaJob) => ({
          id: `adzuna_${job.id}`,
          title: job.title || 'Untitled Position',
          description: job.description || 'No description available',
          location: job.location?.display_name || 'Location not specified',
          company: job.company?.display_name || 'Company not specified',
          url: job.redirect_url || '#',
          type: determineJobType(job.contract_type, job.title || ''),
          category: job.category?.label || job.category?.tag || 'General',
          created: job.created || new Date().toISOString(),
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          source: 'adzuna' as const
        }));
        
        console.log(`Successfully fetched ${unifiedJobs.length} jobs from Adzuna using query: "${searchQuery}"`);
        return unifiedJobs;
      } else {
        console.log(`No results for query: "${searchQuery}", trying next...`);
      }
    }
    
    // If all queries returned no results, fall back to mock data
    console.log('No results found with any search query, falling back to mock data...');
    return getMockAdzunaJobs(limit);
    
  } catch (error) {
    console.error('Error fetching Adzuna jobs:', error);
    console.log('Falling back to mock data...');
    return getMockAdzunaJobs(limit);
  }
}

function buildSearchQuery(profile: any): string {
  if (!profile) return 'graduate';
  
  const queries = [];
  
  // Add degree-related terms (limit to 2 most relevant words)
  if (profile.degree && typeof profile.degree === 'string') {
    const degreeWords = profile.degree.toLowerCase().split(' ');
    const relevantWords = degreeWords.filter((word: string) => 
      word.length > 3 && 
      !['the', 'and', 'or', 'of', 'in', 'at', 'to', 'for', 'with', 'by', 'bachelor', 'masters', 'degree'].includes(word)
    );
    queries.push(...relevantWords.slice(0, 2));
  }
  
  // Add interest-related terms (limit to 2 most relevant words)
  if (profile.interests && typeof profile.interests === 'string') {
    const interests = profile.interests.toLowerCase().split(/[,\s]+/);
    const relevantInterests = interests.filter((interest: string) => 
      interest.length > 3 && 
      !['the', 'and', 'or', 'of', 'in', 'at', 'to', 'for', 'with', 'by'].includes(interest)
    );
    queries.push(...relevantInterests.slice(0, 2));
  }
  
  // Add preferred industries (limit to 1 most relevant)
  if (profile.preferredIndustries && typeof profile.preferredIndustries === 'string') {
    const industries = profile.preferredIndustries.toLowerCase().split(/[,\s]+/);
    const relevantIndustries = industries.filter((industry: string) => 
      industry.length > 3 && 
      !['the', 'and', 'or', 'of', 'in', 'at', 'to', 'for', 'with', 'by'].includes(industry)
    );
    queries.push(...relevantIndustries.slice(0, 1));
  }
  
  // Add ONE primary graduate term (prioritize most common ones)
  const graduateTerms = ['graduate', 'entry level', 'junior', 'trainee', 'internship'];
  // Use a more predictable selection based on profile content
  const hasTechnicalProfile = queries.some(q => 
    ['computer', 'software', 'engineering', 'technology', 'data', 'programming'].includes(q.toLowerCase())
  );
  
  if (hasTechnicalProfile) {
    queries.push('graduate'); // More likely to find tech jobs with "graduate"
  } else {
    queries.push('entry level'); // More general term for other fields
  }
  
  // Remove duplicates and limit to 3 terms maximum
  const uniqueQueries = [...new Set(queries)];
  const finalQuery = uniqueQueries.slice(0, 3).join(' ');
  
  // Ensure we have a valid query
  return finalQuery.trim() || 'graduate';
}

function determineJobType(contractType: string | undefined, title: string): 'internship' | 'job' {
  const titleLower = title.toLowerCase();
  const contractLower = (contractType || '').toLowerCase();
  
  if (titleLower.includes('intern') || 
      titleLower.includes('internship') || 
      contractLower.includes('intern') ||
      contractLower.includes('trainee')) {
    return 'internship';
  }
  
  return 'job';
}

function getMockAdzunaJobs(limit: number): UnifiedJob[] {
  const mockJobs: UnifiedJob[] = [
    {
      id: 'adzuna_mock_1',
      title: 'Software Engineer - Graduate Program',
      description: 'Join our graduate program and work on cutting-edge software projects. We provide mentorship and training in modern technologies including React, Node.js, and cloud platforms.',
      location: 'Auckland, New Zealand',
      company: 'TechCorp NZ',
      url: 'https://example.com/job1',
      type: 'job',
      category: 'Technology',
      created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      salary_min: 55000,
      salary_max: 70000,
      source: 'adzuna'
    },
    {
      id: 'adzuna_mock_2',
      title: 'Data Analyst Internship',
      description: 'Learn data analysis and business intelligence in a supportive environment. Work with real datasets and gain experience with Python, SQL, and visualization tools.',
      location: 'Wellington, New Zealand',
      company: 'DataFlow Analytics',
      url: 'https://example.com/job2',
      type: 'internship',
      category: 'Data & Analytics',
      created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      salary_min: 45000,
      salary_max: 55000,
      source: 'adzuna'
    },
    {
      id: 'adzuna_mock_3',
      title: 'Marketing Coordinator',
      description: 'Help grow our brand through digital marketing, social media management, and content creation. Perfect for graduates with creative and analytical skills.',
      location: 'Christchurch, New Zealand',
      company: 'GrowthMarketing Ltd',
      url: 'https://example.com/job3',
      type: 'job',
      category: 'Marketing',
      created: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      salary_min: 48000,
      salary_max: 60000,
      source: 'adzuna'
    },
    {
      id: 'adzuna_mock_4',
      title: 'Junior Developer - Full Stack',
      description: 'Work on both frontend and backend development using modern frameworks. Great opportunity for recent graduates to grow their technical skills.',
      location: 'Dunedin, New Zealand',
      company: 'WebSolutions NZ',
      url: 'https://example.com/job4',
      type: 'job',
      category: 'Technology',
      created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      salary_min: 50000,
      salary_max: 65000,
      source: 'adzuna'
    },
    {
      id: 'adzuna_mock_5',
      title: 'Business Analyst Intern',
      description: 'Support business operations and process improvement initiatives. Learn about business analysis, project management, and stakeholder communication.',
      location: 'Hamilton, New Zealand',
      company: 'BusinessFirst Consulting',
      url: 'https://example.com/job5',
      type: 'internship',
      category: 'Business',
      created: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
      salary_min: 42000,
      salary_max: 52000,
      source: 'adzuna'
    }
  ];
  
  return mockJobs.slice(0, limit);
}

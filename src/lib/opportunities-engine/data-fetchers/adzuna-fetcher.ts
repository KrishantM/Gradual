// Adzuna Data Fetcher for Opportunities Engine
// Fetches jobs from Adzuna API and transforms them to Opportunity format

import { fetchAdzunaJobs, UnifiedJob } from '../../../../lib/opportunityFetchers/adzuna';
import { Opportunity, OpportunityType } from '@/types/opportunities';

/**
 * Fetch opportunities from Adzuna API
 * Transforms Adzuna jobs to Opportunity format
 */
export async function fetchOpportunitiesFromAdzuna(
  profile: any,
  options: {
    limit?: number;
    country?: string;
  } = {}
): Promise<Opportunity[]> {
  try {
    const { limit = 50, country = 'nz' } = options;
    
    // Fetch jobs from Adzuna
    const adzunaJobs = await fetchAdzunaJobs(profile, limit, country);
    
    // Transform to Opportunity format
    const opportunities: Opportunity[] = adzunaJobs.map((job: UnifiedJob) => {
      // Extract location components
      const locationParts = parseLocation(job.location);
      
      // Determine opportunity type
      const type: OpportunityType = job.type === 'internship' ? 'internship' : 'job';
      
      // Extract tags from title and description
      const tags = extractTagsFromJob(job);
      
      return {
        id: `adzuna_${job.id}`,
        title: job.title,
        description: job.description || 'No description available',
        type,
        organization: job.company,
        location: job.location,
        city: locationParts.city,
        country: locationParts.country || 'New Zealand',
        isRemote: job.location.toLowerCase().includes('remote'),
        createdAt: job.created,
        tags,
        category: job.category || 'General',
        url: job.url,
        salaryMin: job.salary_min,
        salaryMax: job.salary_max,
        currency: 'NZD',
        source: 'adzuna',
        metadata: {
          originalId: job.id,
          fetchedAt: new Date().toISOString()
        }
      };
    });
    
    return opportunities;
  } catch (error) {
    console.error('Error fetching opportunities from Adzuna:', error);
    return [];
  }
}

/**
 * Parse location string into city and country
 */
function parseLocation(location: string): { city?: string; country?: string } {
  if (!location) return {};
  
  const locationLower = location.toLowerCase();
  
  // Check for remote
  if (locationLower.includes('remote')) {
    return { city: undefined, country: undefined };
  }
  
  // Common patterns: "City, Country" or "City Country"
  const parts = location.split(',').map(s => s.trim());
  
  if (parts.length >= 2) {
    return {
      city: parts[0],
      country: parts[parts.length - 1]
    };
  }
  
  // Try to extract city from common NZ cities
  const nzCities = ['auckland', 'wellington', 'christchurch', 'hamilton', 'dunedin', 'tauranga', 'napier', 'palmerston north'];
  for (const city of nzCities) {
    if (locationLower.includes(city)) {
      return {
        city: city.charAt(0).toUpperCase() + city.slice(1),
        country: 'New Zealand'
      };
    }
  }
  
  // Default to New Zealand if location contains NZ indicators
  if (locationLower.includes('new zealand') || locationLower.includes('nz')) {
    return {
      city: parts[0] || undefined,
      country: 'New Zealand'
    };
  }
  
  return {
    city: parts[0] || undefined
  };
}

/**
 * Extract tags from job title and description
 */
function extractTagsFromJob(job: UnifiedJob): string[] {
  const tags: string[] = [];
  const text = `${job.title} ${job.description}`.toLowerCase();
  
  // Technology tags
  const techTags = [
    'javascript', 'python', 'java', 'react', 'node.js', 'typescript',
    'html', 'css', 'sql', 'mongodb', 'postgresql', 'aws', 'azure',
    'docker', 'kubernetes', 'git', 'github', 'vue', 'angular',
    'php', 'ruby', 'go', 'rust', 'swift', 'kotlin'
  ];
  
  // Role/industry tags
  const roleTags = [
    'developer', 'engineer', 'analyst', 'designer', 'manager',
    'marketing', 'sales', 'finance', 'accounting', 'consultant',
    'data scientist', 'machine learning', 'ai', 'cybersecurity',
    'product manager', 'project manager', 'business analyst'
  ];
  
  // Experience level tags
  const levelTags = [
    'graduate', 'junior', 'entry level', 'internship', 'trainee',
    'senior', 'lead', 'principal', 'mid-level'
  ];
  
  // Check for matches
  [...techTags, ...roleTags, ...levelTags].forEach(tag => {
    if (text.includes(tag)) {
      tags.push(tag);
    }
  });
  
  // Add job type tag
  if (job.type === 'internship') {
    tags.push('internship');
  } else {
    tags.push('job');
  }
  
  // Add category tag if available
  if (job.category) {
    tags.push(job.category.toLowerCase());
  }
  
  return [...new Set(tags)]; // Remove duplicates
}

/**
 * Get total job count from Adzuna (for statistics)
 * Note: This would require an additional API call
 */
export async function getAdzunaJobCount(
  country: string = 'nz'
): Promise<number> {
  // Adzuna API doesn't provide a simple count endpoint
  // We'd need to make a search query and get the count from the response
  // For now, return 0 as a placeholder
  return 0;
}


import { Opportunity, OpportunityType } from '@/types/opportunities';
import { OpportunityConnector, ConnectorConfig, ConnectorResult } from './types';

interface AdzunaJob {
  id: string;
  title?: string;
  description?: string;
  location?: { display_name?: string; area?: string[] };
  company?: { display_name?: string };
  redirect_url?: string;
  contract_type?: string;
  salary_min?: number;
  salary_max?: number;
  created?: string;
  category?: { tag?: string; label?: string };
}

interface AdzunaResponse {
  results: AdzunaJob[];
  count: number;
}

const NZ_CITIES = ['auckland', 'wellington', 'christchurch', 'hamilton', 'dunedin', 'tauranga', 'napier', 'palmerston north', 'nelson', 'rotorua'];

function parseLocation(location: string): { city?: string; country?: string } {
  if (!location) return {};
  const lower = location.toLowerCase();
  if (lower.includes('remote')) return {};
  for (const city of NZ_CITIES) {
    if (lower.includes(city)) {
      return { city: city.charAt(0).toUpperCase() + city.slice(1), country: 'New Zealand' };
    }
  }
  const parts = location.split(',').map(s => s.trim());
  return {
    city: parts[0] || undefined,
    country: parts.length > 1 ? parts[parts.length - 1] : undefined,
  };
}

function determineType(contractType: string | undefined, title: string): OpportunityType {
  const lower = (title + ' ' + (contractType || '')).toLowerCase();
  if (lower.includes('intern') || lower.includes('trainee')) return 'internship';
  return 'job';
}

function extractTags(title: string, description: string): string[] {
  const tags = new Set<string>();
  const text = `${title} ${description}`.toLowerCase();
  const keywords = [
    // Tech / engineering
    'javascript', 'python', 'java', 'react', 'node.js', 'typescript',
    'html', 'css', 'sql', 'mongodb', 'aws', 'azure', 'docker',
    'kubernetes', 'git', 'vue', 'angular', 'php', 'ruby', 'go',
    'c#', '.net', 'swift', 'kotlin', 'rust', 'terraform',
    'graphql', 'rest api', 'microservices', 'devops', 'ci/cd',
    // Data / AI
    'data scientist', 'machine learning', 'data analyst', 'data engineering',
    'artificial intelligence', 'deep learning', 'nlp', 'tableau', 'power bi',
    // Business / professional
    'developer', 'engineer', 'analyst', 'designer', 'marketing',
    'sales', 'finance', 'accounting', 'consulting', 'project management',
    'product manager', 'business analyst', 'ux', 'ui', 'graphic design',
    'communications', 'public relations', 'human resources',
    // Career stage
    'graduate', 'junior', 'entry level', 'internship', 'trainee',
    'cadet', 'graduate programme', 'new graduate',
    // Industries
    'healthcare', 'education', 'sustainability', 'renewable energy',
    'construction', 'legal', 'government', 'not for profit', 'startup',
  ];
  for (const kw of keywords) {
    if (text.includes(kw)) tags.add(kw);
  }
  return Array.from(tags);
}

function transformJob(job: AdzunaJob): Opportunity {
  const loc = job.location?.display_name || 'New Zealand';
  const parsed = parseLocation(loc);
  const type = determineType(job.contract_type, job.title || '');
  const tags = extractTags(job.title || '', job.description || '');

  return {
    id: `adzuna_${job.id}`,
    type,
    source: 'adzuna',
    sourceId: String(job.id),
    sourceUrl: job.redirect_url || '',
    canonicalUrl: job.redirect_url || '',
    title: job.title || 'Untitled Position',
    organization: job.company?.display_name || 'Unknown Company',
    description: job.description || 'No description available',
    location: loc,
    locationType: loc.toLowerCase().includes('remote') ? 'remote' : 'onsite',
    isRemote: loc.toLowerCase().includes('remote'),
    city: parsed.city,
    country: parsed.country || 'New Zealand',
    tags,
    category: job.category?.label || 'General',
    industries: job.category?.label ? [job.category.label] : [],
    url: job.redirect_url || '#',
    applicationType: 'external',
    status: 'active',
    createdAt: job.created || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    salaryMin: job.salary_min,
    salaryMax: job.salary_max,
    currency: 'NZD',
    compensation: {
      type: 'paid',
      currency: 'NZD',
      salaryMin: job.salary_min,
      salaryMax: job.salary_max,
    },
    dates: { posted: job.created },
    rawSourceData: job as unknown as Record<string, unknown>,
  };
}

async function fetchFromAdzuna(
  config: ConnectorConfig,
  profile?: any
): Promise<Opportunity[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) {
    console.warn('[AdzunaConnector] Missing API credentials');
    return [];
  }

  const country = config.country || 'nz';
  const queries = buildQueries(profile);
  const allJobs: Opportunity[] = [];
  const seenIds = new Set<string>();

  // Search from user's city plus broader NZ (no location filter) for more coverage
  const userCity = profile?.city || 'Auckland';
  const locations = [userCity, '']; // '' = no location filter = all NZ

  // Distribute budget across queries and locations
  const totalBudget = config.maxResults || 200;
  const perRequest = Math.min(Math.ceil(totalBudget / (queries.length * locations.length)), 50);

  for (const query of queries) {
    for (const location of locations) {
      try {
        const params = new URLSearchParams({
          app_id: appId,
          app_key: appKey,
          results_per_page: String(perRequest),
          what: query,
          sort_by: 'date',
        });
        if (location) params.set('where', location);

        const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params}`;
        const res = await fetch(url, {
          headers: { Accept: 'application/json', 'User-Agent': 'Gradual-App/2.0' },
        });
        if (!res.ok) continue;
        const data: AdzunaResponse = await res.json();
        if (data.results?.length > 0) {
          for (const job of data.results) {
            const id = `adzuna_${job.id}`;
            if (!seenIds.has(id)) {
              seenIds.add(id);
              allJobs.push(transformJob(job));
            }
          }
        }
      } catch (err) {
        console.error(`[AdzunaConnector] Query "${query}" location "${location}" failed:`, err);
      }

      // Early exit if we have enough
      if (allJobs.length >= totalBudget) break;
    }
    if (allJobs.length >= totalBudget) break;
  }
  return allJobs;
}

function buildQueries(profile: any): string[] {
  const queries: string[] = [];

  // Profile-based queries (most relevant)
  if (profile?.degree) {
    const stopWords = new Set(['bachelor', 'bachelors', 'masters', 'master', 'degree', 'of', 'the', 'and', 'for', 'in', 'science', 'arts', 'with']);
    const words = profile.degree.toLowerCase().split(/\s+/).filter(
      (w: string) => w.length > 3 && !stopWords.has(w)
    );
    if (words.length > 0) {
      queries.push(words.slice(0, 2).join(' ') + ' graduate');
      queries.push(words.slice(0, 2).join(' ')); // Also search without "graduate" for broader results
    }
  }

  // Interest-based queries
  if (profile?.interests && Array.isArray(profile.interests)) {
    for (const interest of profile.interests.slice(0, 3)) {
      if (interest && interest.length > 2) queries.push(interest);
    }
  }

  // Industry-based queries
  if (profile?.preferredIndustries && Array.isArray(profile.preferredIndustries)) {
    for (const industry of profile.preferredIndustries.slice(0, 3)) {
      if (industry && industry.length > 2) queries.push(industry);
    }
  }

  // Broad career stage queries (always included)
  queries.push('graduate', 'entry level', 'junior', 'internship');

  // Additional broad queries for coverage
  queries.push('graduate programme', 'trainee', 'cadet');

  // Deduplicate
  return [...new Set(queries)];
}

export const adzunaConnector: OpportunityConnector = {
  name: 'adzuna',
  supportedTypes: ['job', 'internship'],
  async fetch(config, userProfile): Promise<ConnectorResult> {
    const errors: string[] = [];
    let opportunities: Opportunity[] = [];
    try {
      opportunities = await fetchFromAdzuna(config, userProfile);
    } catch (err) {
      errors.push(String(err));
    }
    return {
      opportunities,
      source: 'adzuna',
      fetchedAt: new Date().toISOString(),
      stats: { fetched: opportunities.length, validated: opportunities.length, errors },
    };
  },
};

// Opportunity Aggregator
// Aggregates opportunities from multiple data sources (Firestore, Adzuna, etc.)

import { Opportunity, OpportunityType } from '@/types/opportunities';
import { fetchOpportunitiesFromFirestore } from './firestore-fetcher';
import { fetchOpportunitiesFromAdzuna } from './adzuna-fetcher';
import { getMockOpportunities } from '../mock-data';

export interface AggregationOptions {
  types?: OpportunityType[];
  location?: {
    city?: string;
    country?: string;
    allowRemote?: boolean;
  };
  minDate?: string;
  maxDate?: string;
  limit?: number;
  excludeExpired?: boolean;
  useMockData?: boolean; // Fallback to mock data if no real data available
  sources?: string[]; // Which sources to use: 'firestore', 'adzuna', 'mock'
}

/**
 * Aggregate opportunities from all available data sources
 */
export async function aggregateOpportunities(
  userProfile: any,
  options: AggregationOptions = {}
): Promise<Opportunity[]> {
  const {
    types,
    location,
    minDate,
    maxDate,
    limit = 100,
    excludeExpired = true,
    useMockData = true,
    sources = ['firestore', 'adzuna'] // Default to using both sources
  } = options;

  const allOpportunities: Opportunity[] = [];
  const sourcePromises: Promise<Opportunity[]>[] = [];

  // Fetch from Firestore if enabled
  if (sources.includes('firestore')) {
    sourcePromises.push(
      fetchOpportunitiesFromFirestore({
        types,
        location,
        minDate,
        maxDate,
        limit: Math.ceil(limit * 0.6), // Allocate 60% to Firestore
        excludeExpired
      }).catch(error => {
        console.error('Error fetching from Firestore:', error);
        return [];
      })
    );
  }

  // Fetch from Adzuna if enabled
  if (sources.includes('adzuna')) {
    sourcePromises.push(
      fetchOpportunitiesFromAdzuna(userProfile, {
        limit: Math.ceil(limit * 0.4), // Allocate 40% to Adzuna
        country: location?.country === 'New Zealand' ? 'nz' : 'nz' // Default to NZ
      }).catch(error => {
        console.error('Error fetching from Adzuna:', error);
        return [];
      })
    );
  }

  // Fetch from all sources in parallel
  const results = await Promise.all(sourcePromises);
  
  // Combine results
  results.forEach(opportunities => {
    allOpportunities.push(...opportunities);
  });

  // Deduplicate opportunities based on title and organization
  const deduplicated = deduplicateOpportunities(allOpportunities);

  // If no opportunities found and mock data is enabled, use mock data
  if (deduplicated.length === 0 && useMockData) {
    console.log('No real opportunities found, falling back to mock data');
    const mockOpportunities = getMockOpportunities();
    
    // Apply filters to mock data
    let filtered = mockOpportunities;
    if (types && types.length > 0) {
      filtered = filtered.filter(opp => types.includes(opp.type));
    }
    if (location) {
      filtered = filtered.filter(opp => {
        if (location.allowRemote && opp.isRemote) return true;
        if (location.city && opp.city) {
          return opp.city.toLowerCase().includes(location.city.toLowerCase());
        }
        if (location.country && opp.country) {
          return opp.country.toLowerCase() === location.country.toLowerCase();
        }
        return true;
      });
    }
    
    return filtered.slice(0, limit);
  }

  // Apply limit
  return deduplicated.slice(0, limit);
}

/**
 * Deduplicate opportunities based on title and organization
 */
function deduplicateOpportunities(opportunities: Opportunity[]): Opportunity[] {
  const seen = new Set<string>();
  const unique: Opportunity[] = [];

  for (const opp of opportunities) {
    // Create a unique key from title and organization
    const key = `${opp.title.toLowerCase().trim()}_${opp.organization.toLowerCase().trim()}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(opp);
    }
  }

  return unique;
}

/**
 * Get statistics about available opportunities
 */
export async function getOpportunityStats(): Promise<{
  total: number;
  byType: Record<OpportunityType, number>;
  bySource: Record<string, number>;
}> {
  try {
    // This would ideally query all sources, but for now we'll use Firestore
    const firestoreOpps = await fetchOpportunitiesFromFirestore({ limit: 10000 });
    
    const stats = {
      total: firestoreOpps.length,
      byType: {
        job: 0,
        internship: 0,
        club: 0,
        volunteering: 0,
        event: 0,
        scholarship: 0
      } as Record<OpportunityType, number>,
      bySource: {} as Record<string, number>
    };

    firestoreOpps.forEach(opp => {
      stats.byType[opp.type] = (stats.byType[opp.type] || 0) + 1;
      stats.bySource[opp.source] = (stats.bySource[opp.source] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('Error getting opportunity stats:', error);
    return {
      total: 0,
      byType: {
        job: 0,
        internship: 0,
        club: 0,
        volunteering: 0,
        event: 0,
        scholarship: 0
      },
      bySource: {}
    };
  }
}


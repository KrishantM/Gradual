import { Opportunity, OpportunityType } from '@/types/opportunities';
import { fetchOpportunitiesFromFirestore } from './firestore-fetcher';
import { runAllConnectors } from '../connectors';
import { deduplicateOpportunities } from '../deduplication';

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
  useMockData?: boolean;
  sources?: string[];
  runLiveConnectors?: boolean;
}

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
    sources = ['firestore'],
    runLiveConnectors = false,
  } = options;

  const allOpportunities: Opportunity[] = [];
  const sourcePromises: Promise<Opportunity[]>[] = [];

  if (sources.includes('firestore')) {
    sourcePromises.push(
      fetchOpportunitiesFromFirestore({
        types,
        location,
        minDate,
        maxDate,
        limit: Math.max(limit * 2, 500),
        excludeExpired,
      }).catch(error => {
        console.error('Error fetching from Firestore:', error);
        return [];
      })
    );
  }

  if (runLiveConnectors || sources.includes('connectors')) {
    sourcePromises.push(
      runAllConnectors({ maxResults: Math.ceil(limit * 0.5), country: location?.country === 'New Zealand' ? 'nz' : 'nz' }, userProfile)
        .then(result => result.opportunities)
        .catch(error => {
          console.error('Error running connectors:', error);
          return [];
        })
    );
  }

  const results = await Promise.all(sourcePromises);
  for (const opps of results) {
    allOpportunities.push(...opps);
  }

  const deduplicated = deduplicateOpportunities(allOpportunities);
  return deduplicated.slice(0, limit);
}

export async function getOpportunityStats(): Promise<{
  total: number;
  byType: Record<OpportunityType, number>;
  bySource: Record<string, number>;
}> {
  try {
    const firestoreOpps = await fetchOpportunitiesFromFirestore({ limit: 10000 });
    const stats = {
      total: firestoreOpps.length,
      byType: {
        job: 0, internship: 0, club: 0, volunteering: 0,
        event: 0, scholarship: 0, competition: 0,
      } as Record<OpportunityType, number>,
      bySource: {} as Record<string, number>,
    };
    for (const opp of firestoreOpps) {
      stats.byType[opp.type] = (stats.byType[opp.type] || 0) + 1;
      stats.bySource[opp.source] = (stats.bySource[opp.source] || 0) + 1;
    }
    return stats;
  } catch (error) {
    console.error('Error getting opportunity stats:', error);
    return {
      total: 0,
      byType: { job: 0, internship: 0, club: 0, volunteering: 0, event: 0, scholarship: 0, competition: 0 },
      bySource: {},
    };
  }
}

import { OpportunityConnector, ConnectorConfig, ConnectorResult, DEFAULT_CONNECTOR_CONFIG } from './types';
import { adzunaConnector } from './adzuna-connector';
import { eventsConnector } from './events-connector';
import { volunteeringConnector } from './volunteering-connector';
import { clubsConnector } from './clubs-connector';
import { scholarshipsConnector } from './scholarships-connector';
import { competitionsConnector } from './competitions-connector';
import { internshipsConnector } from './internships-connector';
import { Opportunity } from '@/types/opportunities';
import { validateBatch } from '../validation';
import { deduplicateOpportunities } from '../deduplication';
import { filterFreshOpportunities } from '../freshness';

export const ALL_CONNECTORS: OpportunityConnector[] = [
  adzunaConnector,
  eventsConnector,
  volunteeringConnector,
  clubsConnector,
  scholarshipsConnector,
  competitionsConnector,
  internshipsConnector,
];

export interface IngestionResult {
  totalFetched: number;
  totalValidated: number;
  totalDeduplicated: number;
  totalFresh: number;
  bySource: Record<string, { fetched: number; validated: number; errors: string[] }>;
  opportunities: Opportunity[];
  errors: string[];
  durationMs: number;
}

export async function runAllConnectors(
  configOverrides: Partial<ConnectorConfig> = {},
  userProfile?: any
): Promise<IngestionResult> {
  const start = Date.now();
  const config = { ...DEFAULT_CONNECTOR_CONFIG, ...configOverrides };
  const allErrors: string[] = [];
  const bySource: Record<string, { fetched: number; validated: number; errors: string[] }> = {};
  const allOpportunities: Opportunity[] = [];

  const results = await Promise.allSettled(
    ALL_CONNECTORS.filter(c => config.enabled !== false).map(connector =>
      connector.fetch(config, userProfile).then(result => ({ connector: connector.name, result }))
    )
  );

  for (const settled of results) {
    if (settled.status === 'fulfilled') {
      const { connector, result } = settled.value;
      bySource[connector] = {
        fetched: result.stats.fetched,
        validated: result.stats.validated,
        errors: result.stats.errors,
      };
      allOpportunities.push(...result.opportunities);
      allErrors.push(...result.stats.errors);
    } else {
      allErrors.push(`Connector failed: ${settled.reason}`);
    }
  }

  const totalFetched = allOpportunities.length;

  const { valid } = validateBatch(allOpportunities);
  const totalValidated = valid.length;

  const deduplicated = deduplicateOpportunities(valid);
  const totalDeduplicated = deduplicated.length;

  const fresh = filterFreshOpportunities(deduplicated);
  const totalFresh = fresh.length;

  return {
    totalFetched,
    totalValidated,
    totalDeduplicated,
    totalFresh,
    bySource,
    opportunities: fresh,
    errors: allErrors,
    durationMs: Date.now() - start,
  };
}

export { adzunaConnector, eventsConnector, volunteeringConnector, clubsConnector, scholarshipsConnector, competitionsConnector, internshipsConnector };
export type { OpportunityConnector, ConnectorConfig, ConnectorResult };

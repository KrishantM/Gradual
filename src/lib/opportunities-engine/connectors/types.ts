import { Opportunity, OpportunityType } from '@/types/opportunities';

export interface ConnectorConfig {
  enabled: boolean;
  maxResults?: number;
  country?: string;
  cacheTtlMinutes?: number;
}

export interface ConnectorResult {
  opportunities: Opportunity[];
  source: string;
  fetchedAt: string;
  stats: {
    fetched: number;
    validated: number;
    errors: string[];
  };
}

export interface OpportunityConnector {
  name: string;
  supportedTypes: OpportunityType[];
  fetch(config: ConnectorConfig, userProfile?: any): Promise<ConnectorResult>;
}

export const DEFAULT_CONNECTOR_CONFIG: ConnectorConfig = {
  enabled: true,
  maxResults: 200,
  country: 'nz',
  cacheTtlMinutes: 60,
};

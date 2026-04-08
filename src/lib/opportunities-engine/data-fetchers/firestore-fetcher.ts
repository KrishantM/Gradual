// Firestore Data Fetcher for Opportunities Engine
// Fetches opportunities from Firestore database

import { db } from '../../../../lib/firebase-admin';
import { Opportunity, OpportunityType } from '@/types/opportunities';

/**
 * Fetch opportunities from Firestore
 * Supports filtering by type, location, and date ranges
 */
export async function fetchOpportunitiesFromFirestore(
  options: {
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
  } = {}
): Promise<Opportunity[]> {
  try {
    const {
      types,
      location,
      minDate,
      maxDate,
      limit = 1000,
      excludeExpired = true
    } = options;

    let query: FirebaseFirestore.Query = db.collection('opportunities');

    // Filter by type if specified
    if (types && types.length > 0 && types.length <= 10) {
      query = query.where('type', 'in', types);
    }

    query = query.limit(limit);

    const snapshot = await query.get();
    const opportunities: Opportunity[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      
      if (types && types.length > 0 && !types.includes(data.type as OpportunityType)) {
        return;
      }

      // Transform Firestore data to Opportunity format
      const opportunity: Opportunity = {
        id: data.id || doc.id,
        title: data.title || 'Untitled Opportunity',
        description: data.description || '',
        type: (data.type as OpportunityType) || 'job',
        source: data.source || 'firestore',
        sourceId: data.sourceId,
        sourceUrl: data.sourceUrl,
        canonicalUrl: data.canonicalUrl,
        organization: data.company || data.organization || 'Unknown Organization',
        organizationUrl: data.organizationUrl,
        summary: data.summary,
        location: typeof data.location === 'string' ? data.location : '',
        locationType: data.locationType,
        city: data.city || extractCityFromLocation(data.location),
        country: data.country || extractCountryFromLocation(data.location),
        region: data.region,
        isRemote: data.isRemote || (typeof data.location === 'string' && data.location.toLowerCase().includes('remote')) || false,
        createdAt: data.created || data.createdAt || doc.createTime?.toDate().toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt,
        expiresAt: data.expiresAt,
        deadline: data.deadline,
        startDate: data.startDate,
        endDate: data.endDate,
        dates: data.dates,
        tags: data.tags || extractTagsFromDescription(data.description || ''),
        categoryTags: data.categoryTags,
        skills: data.skills,
        industries: data.industries,
        category: data.category || 'General',
        eligibility: data.eligibility,
        url: data.url || '#',
        applicationType: data.applicationType,
        requirements: data.requirements || [],
        benefits: data.benefits || [],
        salaryMin: data.salary_min || data.salaryMin,
        salaryMax: data.salary_max || data.salaryMax,
        currency: data.currency || 'NZD',
        compensation: data.compensation,
        status: data.status || 'active',
        validation: data.validation,
        metadata: {
          fetchedAt: data.fetched_at || data.fetchedAt,
          docId: doc.id,
          ingestedAt: data.ingestedAt,
        },
      };

      if (data.status === 'expired' || data.status === 'closed') {
        return;
      }

      if (excludeExpired && opportunity.deadline) {
        const deadline = new Date(opportunity.deadline);
        if (deadline < new Date()) {
          return;
        }
      }

      // Filter by location if specified
      if (location) {
        // Allow remote opportunities if specified
        if (location.allowRemote && opportunity.isRemote) {
          opportunities.push(opportunity);
          return;
        }

        // Check city match
        if (location.city && opportunity.city) {
          const oppCity = opportunity.city.toLowerCase();
          const queryCity = location.city.toLowerCase();
          if (oppCity.includes(queryCity) || queryCity.includes(oppCity)) {
            opportunities.push(opportunity);
            return;
          }
        }

        // Check country match
        if (location.country && opportunity.country) {
          const oppCountry = opportunity.country.toLowerCase();
          const queryCountry = location.country.toLowerCase();
          if (oppCountry === queryCountry) {
            opportunities.push(opportunity);
            return;
          }
        }

        // If no specific location filters, include all
        if (!location.city && !location.country) {
          opportunities.push(opportunity);
        }
      } else {
        // No location filter, include all
        opportunities.push(opportunity);
      }
    });

    // In-memory date filtering (field names vary between sources)
    let filtered = opportunities;
    if (minDate) {
      const min = new Date(minDate);
      filtered = filtered.filter(o => new Date(o.createdAt) >= min);
    }
    if (maxDate) {
      const max = new Date(maxDate);
      filtered = filtered.filter(o => new Date(o.createdAt) <= max);
    }

    // Sort by creation date, newest first
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return filtered;
  } catch (error) {
    console.error('Error fetching opportunities from Firestore:', error);
    return [];
  }
}

/**
 * Extract city from location string
 */
function extractCityFromLocation(location: unknown): string | undefined {
  if (!location || typeof location !== 'string') return undefined;
  const parts = location.split(',').map(s => s.trim());
  return parts.length > 0 ? parts[0] : undefined;
}

function extractCountryFromLocation(location: unknown): string | undefined {
  if (!location || typeof location !== 'string') return undefined;
  const parts = location.split(',').map(s => s.trim());
  if (parts.length > 1) return parts[parts.length - 1];
  const lower = location.toLowerCase();
  if (lower.includes('new zealand') || lower.includes('nz')) return 'New Zealand';
  if (lower.includes('australia') || lower.includes('au')) return 'Australia';
  return undefined;
}

/**
 * Extract tags from description using simple keyword matching
 * This is a basic implementation - could be enhanced with NLP
 */
function extractTagsFromDescription(description: string): string[] {
  if (!description) return [];
  
  const tags: string[] = [];
  const descriptionLower = description.toLowerCase();
  
  // Common skill/technology keywords
  const commonTags = [
    'javascript', 'python', 'java', 'react', 'node.js', 'typescript',
    'html', 'css', 'sql', 'mongodb', 'postgresql', 'aws', 'azure',
    'docker', 'kubernetes', 'git', 'github', 'agile', 'scrum',
    'marketing', 'sales', 'finance', 'accounting', 'design', 'ui/ux',
    'data analysis', 'machine learning', 'ai', 'business', 'consulting',
    'remote', 'full-time', 'part-time', 'internship', 'graduate'
  ];
  
  for (const tag of commonTags) {
    if (descriptionLower.includes(tag)) {
      tags.push(tag);
    }
  }
  
  return tags;
}

/**
 * Get opportunity count from Firestore (for statistics)
 */
export async function getOpportunityCount(
  type?: OpportunityType
): Promise<number> {
  try {
    let query: FirebaseFirestore.Query = db.collection('opportunities');
    
    if (type) {
      query = query.where('type', '==', type);
    }
    
    const snapshot = await query.count().get();
    return snapshot.data().count;
  } catch (error) {
    console.error('Error getting opportunity count:', error);
    return 0;
  }
}


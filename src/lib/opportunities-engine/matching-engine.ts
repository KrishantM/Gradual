// Opportunities Matching Engine
// This file contains the core matching and scoring logic for the Opportunities Engine
// Now integrated with live data sources (Firestore, Adzuna, etc.)

import { Opportunity, OpportunityQuery, OpportunityMatchResult, UserProfileSnapshot } from '@/types/opportunities';
import { getMockOpportunities } from './mock-data';
import { aggregateOpportunities, AggregationOptions } from './data-fetchers/opportunity-aggregator';

/**
 * Scoring weights for different matching factors
 * These can be adjusted to fine-tune the matching algorithm
 */
const SCORE_WEIGHTS = {
  skillOverlap: 0.35,      // 35% - Skills and tags matching
  tagOverlap: 0.25,         // 25% - Tag overlap between user and opportunity
  locationMatch: 0.20,      // 20% - Location preferences
  goalAlignment: 0.10,      // 10% - Alignment with user's goal
  recency: 0.10,           // 10% - How recent the opportunity is
};

/**
 * Match opportunities based on a query
 * This is the main entry point for the matching engine
 * Now uses live data from Firestore, Adzuna, and other sources
 */
export async function matchOpportunities(query: OpportunityQuery): Promise<OpportunityMatchResult> {
  const startTime = Date.now();
  
  // Build aggregation options from query
  const aggregationOptions: AggregationOptions = {
    types: query.types,
    location: query.location,
    minDate: query.minDate,
    maxDate: query.maxDate,
    limit: query.limit ? query.limit * 2 : 200, // Fetch more to allow for scoring/filtering
    excludeExpired: query.excludeExpired !== false,
    useMockData: true, // Fallback to mock data if no real data available
    sources: ['firestore', 'adzuna'] // Use both Firestore and Adzuna
  };
  
  // Get opportunities from all sources
  // Transform userProfile to the format expected by aggregator
  const userProfileForAggregation = {
    city: query.userProfile.city,
    country: query.userProfile.country,
    degree: query.userProfile.degree,
    interests: query.userProfile.interests,
    preferredIndustries: query.userProfile.preferredIndustries
  };
  
  let opportunities: Opportunity[];
  try {
    opportunities = await aggregateOpportunities(userProfileForAggregation, aggregationOptions);
  } catch (error) {
    console.error('Error aggregating opportunities, falling back to mock data:', error);
    opportunities = getMockOpportunities();
  }
  
  // Apply additional filters that weren't handled by the aggregator
  opportunities = filterOpportunities(opportunities, query);
  
  // Score each opportunity
  const scoredOpportunities = opportunities.map(opp => ({
    ...opp,
    score: calculateOpportunityScore(opp, query.userProfile, query)
  }));
  
  // Sort by score (highest first)
  scoredOpportunities.sort((a, b) => (b.score || 0) - (a.score || 0));
  
  // Apply minimum score filter
  const minScore = query.minScore ?? 0;
  const filteredByScore = scoredOpportunities.filter(opp => (opp.score || 0) >= minScore);
  
  // Apply limit
  const limit = query.limit ?? 20;
  const finalResults = filteredByScore.slice(0, limit);
  
  const executionTime = Date.now() - startTime;
  
  return {
    opportunities: finalResults,
    totalMatches: filteredByScore.length,
    query,
    metadata: {
      executionTimeMs: executionTime,
      filtersApplied: getAppliedFilters(query)
    }
  };
}

/**
 * Filter opportunities based on query criteria
 */
function filterOpportunities(
  opportunities: Opportunity[],
  query: OpportunityQuery
): Opportunity[] {
  let filtered = [...opportunities];
  
  // Filter by type
  if (query.types && query.types.length > 0) {
    filtered = filtered.filter(opp => query.types!.includes(opp.type));
  }
  
  // Filter by location
  if (query.location) {
    const location = query.location;
    filtered = filtered.filter(opp => {
      // Allow remote opportunities if specified
      if (location.allowRemote && opp.isRemote) {
        return true;
      }
      
      // Check city match
      if (location.city && opp.city) {
        const oppCity = opp.city.toLowerCase();
        const queryCity = location.city.toLowerCase();
        if (oppCity.includes(queryCity) || queryCity.includes(oppCity)) {
          return true;
        }
      }
      
      // Check country match
      if (location.country && opp.country) {
        const oppCountry = opp.country.toLowerCase();
        const queryCountry = location.country.toLowerCase();
        if (oppCountry === queryCountry) {
          return true;
        }
      }
      
      // If no specific location filters, include all
      if (!location.city && !location.country) {
        return true;
      }
      
      return false;
    });
  }
  
  // Filter expired opportunities
  if (query.excludeExpired !== false) { // Default to true
    const now = new Date();
    filtered = filtered.filter(opp => {
      if (opp.expiresAt) {
        return new Date(opp.expiresAt) > now;
      }
      return true; // No expiration date means it's still valid
    });
  }
  
  // Filter by date range
  if (query.minDate) {
    const minDate = new Date(query.minDate);
    filtered = filtered.filter(opp => new Date(opp.createdAt) >= minDate);
  }
  
  if (query.maxDate) {
    const maxDate = new Date(query.maxDate);
    filtered = filtered.filter(opp => new Date(opp.createdAt) <= maxDate);
  }
  
  // Filter by required tags
  if (query.requiredTags && query.requiredTags.length > 0) {
    filtered = filtered.filter(opp => {
      // Must have at least one required tag
      return query.requiredTags!.some(tag => 
        opp.tags.some(oppTag => 
          oppTag.toLowerCase().includes(tag.toLowerCase()) ||
          tag.toLowerCase().includes(oppTag.toLowerCase())
        )
      );
    });
  }
  
  return filtered;
}

/**
 * Calculate a match score for an opportunity based on user profile
 */
function calculateOpportunityScore(
  opportunity: Opportunity,
  profile: UserProfileSnapshot,
  query: OpportunityQuery
): number {
  const skillScore = calculateSkillOverlapScore(opportunity, profile);
  const tagScore = calculateTagOverlapScore(opportunity, profile, query);
  const locationScore = calculateLocationScore(opportunity, profile, query);
  const goalScore = calculateGoalAlignmentScore(opportunity, profile);
  const recencyScore = calculateRecencyScore(opportunity);
  
  const totalScore = 
    skillScore * SCORE_WEIGHTS.skillOverlap +
    tagScore * SCORE_WEIGHTS.tagOverlap +
    locationScore * SCORE_WEIGHTS.locationMatch +
    goalScore * SCORE_WEIGHTS.goalAlignment +
    recencyScore * SCORE_WEIGHTS.recency;
  
  return Math.round(totalScore);
}

/**
 * Calculate skill overlap score based on user skills and opportunity tags
 */
function calculateSkillOverlapScore(
  opportunity: Opportunity,
  profile: UserProfileSnapshot
): number {
  if (!profile.skills || profile.skills.length === 0) {
    return 50; // Neutral score if no skills provided
  }
  
  const oppTags = opportunity.tags.map(t => t.toLowerCase());
  const userSkills = profile.skills.map(s => s.toLowerCase());
  
  // Count matching skills
  let matches = 0;
  for (const skill of userSkills) {
    if (oppTags.some(tag => tag.includes(skill) || skill.includes(tag))) {
      matches++;
    }
  }
  
  // Calculate percentage match
  const matchRatio = matches / userSkills.length;
  return matchRatio * 100;
}

/**
 * Calculate tag overlap score
 * This considers both general tags and preferred tags from the query
 */
function calculateTagOverlapScore(
  opportunity: Opportunity,
  profile: UserProfileSnapshot,
  query: OpportunityQuery
): number {
  const oppTags = opportunity.tags.map(t => t.toLowerCase());
  const profileTags: string[] = [];
  
  // Collect tags from profile
  if (profile.tags) {
    profileTags.push(...profile.tags.map(t => t.toLowerCase()));
  }
  
  // Extract tags from interests
  if (profile.interests) {
    const interestTags = profile.interests
      .toLowerCase()
      .split(/[,\s]+/)
      .filter(t => t.length > 2);
    profileTags.push(...interestTags);
  }
  
  // Extract tags from preferred industries
  if (profile.preferredIndustries) {
    const industryTags = profile.preferredIndustries
      .toLowerCase()
      .split(/[,\s]+/)
      .filter(t => t.length > 2);
    profileTags.push(...industryTags);
  }
  
  // Extract tags from degree
  if (profile.degree) {
    const degreeTags = profile.degree
      .toLowerCase()
      .split(/\s+/)
      .filter(t => t.length > 3);
    profileTags.push(...degreeTags);
  }
  
  // Count matches
  let matches = 0;
  let totalRelevantTags = profileTags.length;
  
  for (const profileTag of profileTags) {
    if (oppTags.some(oppTag => 
      oppTag.includes(profileTag) || 
      profileTag.includes(oppTag) ||
      oppTag === profileTag
    )) {
      matches++;
    }
  }
  
  // Boost score for preferred tags
  if (query.preferredTags && query.preferredTags.length > 0) {
    const preferredMatches = query.preferredTags.filter(prefTag => 
      oppTags.some(oppTag => 
        oppTag.includes(prefTag.toLowerCase()) || 
        prefTag.toLowerCase().includes(oppTag)
      )
    );
    if (preferredMatches.length > 0) {
      matches += preferredMatches.length * 2; // Double weight for preferred tags
      totalRelevantTags += preferredMatches.length;
    }
  }
  
  if (totalRelevantTags === 0) {
    return 50; // Neutral score
  }
  
  return Math.min(100, (matches / totalRelevantTags) * 100);
}

/**
 * Calculate location match score
 */
function calculateLocationScore(
  opportunity: Opportunity,
  profile: UserProfileSnapshot,
  query: OpportunityQuery
): number {
  // Remote opportunities get a base score
  if (opportunity.isRemote) {
    if (query.location?.allowRemote) {
      return 80; // Good score for remote if user allows it
    }
    return 60; // Moderate score for remote even if not explicitly allowed
  }
  
  // Exact city match
  if (profile.city && opportunity.city) {
    const profileCity = profile.city.toLowerCase();
    const oppCity = opportunity.city.toLowerCase();
    if (profileCity === oppCity || 
        profileCity.includes(oppCity) || 
        oppCity.includes(profileCity)) {
      return 100;
    }
  }
  
  // Country match
  if (profile.country && opportunity.country) {
    const profileCountry = profile.country.toLowerCase();
    const oppCountry = opportunity.country.toLowerCase();
    if (profileCountry === oppCountry) {
      return 70;
    }
  }
  
  // Partial location match (e.g., "Auckland" in "Greater Auckland")
  if (profile.city && opportunity.location) {
    const profileCity = profile.city.toLowerCase();
    const oppLocation = opportunity.location.toLowerCase();
    if (oppLocation.includes(profileCity) || profileCity.includes(oppLocation)) {
      return 80;
    }
  }
  
  return 30; // Low score for no location match
}

/**
 * Calculate goal alignment score
 * This checks if the opportunity aligns with the user's stated goal
 */
function calculateGoalAlignmentScore(
  opportunity: Opportunity,
  profile: UserProfileSnapshot
): number {
  if (!profile.goal) {
    return 50; // Neutral score if no goal provided
  }
  
  const goalText = profile.goal.toLowerCase();
  const oppText = `${opportunity.title} ${opportunity.description} ${opportunity.category}`.toLowerCase();
  
  // Extract keywords from goal
  const goalKeywords = goalText
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !['the', 'and', 'or', 'to', 'for', 'with', 'from'].includes(word));
  
  // Count matches
  let matches = 0;
  for (const keyword of goalKeywords) {
    if (oppText.includes(keyword)) {
      matches++;
    }
  }
  
  if (goalKeywords.length === 0) {
    return 50;
  }
  
  return (matches / goalKeywords.length) * 100;
}

/**
 * Calculate recency score
 * More recent opportunities get higher scores
 */
function calculateRecencyScore(opportunity: Opportunity): number {
  const created = new Date(opportunity.createdAt);
  const now = new Date();
  const daysOld = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysOld <= 1) return 100;
  if (daysOld <= 3) return 95;
  if (daysOld <= 7) return 90;
  if (daysOld <= 14) return 80;
  if (daysOld <= 30) return 70;
  if (daysOld <= 60) return 60;
  if (daysOld <= 90) return 50;
  
  return Math.max(20, 100 - daysOld * 0.5); // Gradual decrease
}

/**
 * Get list of applied filters for metadata
 */
function getAppliedFilters(query: OpportunityQuery): string[] {
  const filters: string[] = [];
  
  if (query.types && query.types.length > 0) {
    filters.push(`types: ${query.types.join(', ')}`);
  }
  
  if (query.location) {
    const locParts: string[] = [];
    if (query.location.city) locParts.push(`city: ${query.location.city}`);
    if (query.location.country) locParts.push(`country: ${query.location.country}`);
    if (query.location.allowRemote) locParts.push('remote: allowed');
    if (locParts.length > 0) {
      filters.push(locParts.join(', '));
    }
  }
  
  if (query.excludeExpired !== false) {
    filters.push('excludeExpired: true');
  }
  
  if (query.requiredTags && query.requiredTags.length > 0) {
    filters.push(`requiredTags: ${query.requiredTags.join(', ')}`);
  }
  
  if (query.minScore !== undefined) {
    filters.push(`minScore: ${query.minScore}`);
  }
  
  if (query.limit) {
    filters.push(`limit: ${query.limit}`);
  }
  
  return filters;
}


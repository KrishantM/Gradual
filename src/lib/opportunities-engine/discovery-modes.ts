// Discovery Modes for Opportunities Engine
// Different ways users can discover opportunities beyond simple matching

import { Opportunity, OpportunityQuery, OpportunityType } from '@/types/opportunities';
import { matchOpportunities } from './matching-engine';

export type DiscoveryMode = 
  | 'for-you'           // Personalized recommendations (default)
  | 'explore'           // Serendipitous discovery
  | 'trending'          // Popular opportunities
  | 'hidden-gems'       // Under-discovered high-match opportunities
  | 'career-path'       // Opportunities building toward career goal
  | 'skill-builder'     // Opportunities for skill development
  | 'location-scout'    // Location-based discovery
  | 'deadline-approaching'; // Time-sensitive opportunities

export interface DiscoveryModeOptions {
  mode: DiscoveryMode;
  userProfile: OpportunityQuery['userProfile'];
  limit?: number;
  customFilters?: Partial<OpportunityQuery>;
}

/**
 * Discover opportunities using a specific discovery mode
 */
export async function discoverOpportunities(
  options: DiscoveryModeOptions
) {
  const { mode, userProfile, limit = 20, customFilters = {} } = options;

  switch (mode) {
    case 'for-you':
      return discoverForYou(userProfile, limit, customFilters);
    
    case 'explore':
      return discoverExplore(userProfile, limit, customFilters);
    
    case 'trending':
      return discoverTrending(userProfile, limit, customFilters);
    
    case 'hidden-gems':
      return discoverHiddenGems(userProfile, limit, customFilters);
    
    case 'career-path':
      return discoverCareerPath(userProfile, limit, customFilters);
    
    case 'skill-builder':
      return discoverSkillBuilder(userProfile, limit, customFilters);
    
    case 'location-scout':
      return discoverLocationScout(userProfile, limit, customFilters);
    
    case 'deadline-approaching':
      return discoverDeadlineApproaching(userProfile, limit, customFilters);
    
    default:
      return discoverForYou(userProfile, limit, customFilters);
  }
}

/**
 * "For You" - Personalized recommendations (default mode)
 */
async function discoverForYou(
  userProfile: OpportunityQuery['userProfile'],
  limit: number,
  customFilters: Partial<OpportunityQuery>
) {
  const query: OpportunityQuery = {
    userProfile,
    limit,
    ...customFilters
  };

  return await matchOpportunities(query);
}

/**
 * "Explore" - Serendipitous discovery based on interests
 * Shows opportunities that might be interesting but not necessarily perfect matches
 */
async function discoverExplore(
  userProfile: OpportunityQuery['userProfile'],
  limit: number,
  customFilters: Partial<OpportunityQuery>
) {
  const query: OpportunityQuery = {
    userProfile,
    limit: limit * 2, // Fetch more to allow for diversity
    minScore: 30, // Lower minimum score for exploration
    ...customFilters
  };

  const result = await matchOpportunities(query);
  
  // Add diversity by mixing high and medium scores
  const sorted = result.opportunities.sort((a, b) => (b.score || 0) - (a.score || 0));
  const highScore = sorted.slice(0, Math.ceil(limit * 0.6));
  const mediumScore = sorted.slice(Math.ceil(limit * 0.6), limit * 2);
  
  // Shuffle medium score opportunities
  const shuffled = mediumScore.sort(() => Math.random() - 0.5);
  const diverse = [...highScore, ...shuffled.slice(0, Math.ceil(limit * 0.4))];
  
  return {
    ...result,
    opportunities: diverse.slice(0, limit)
  };
}

/**
 * "Trending" - Popular opportunities in user's field
 * Opportunities that are recent and have high engagement
 */
async function discoverTrending(
  userProfile: OpportunityQuery['userProfile'],
  limit: number,
  customFilters: Partial<OpportunityQuery>
) {
  const query: OpportunityQuery = {
    userProfile,
    limit: limit * 2,
    minDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
    minScore: 40,
    ...customFilters
  };

  const result = await matchOpportunities(query);
  
  // Boost recency in scoring
  const sorted = result.opportunities.sort((a, b) => {
    const scoreA = (a.score || 0) + getRecencyBoost(a);
    const scoreB = (b.score || 0) + getRecencyBoost(b);
    return scoreB - scoreA;
  });

  return {
    ...result,
    opportunities: sorted.slice(0, limit)
  };
}

/**
 * "Hidden Gems" - Under-discovered opportunities with high match scores
 * Opportunities that match well but might not be getting much attention
 */
async function discoverHiddenGems(
  userProfile: OpportunityQuery['userProfile'],
  limit: number,
  customFilters: Partial<OpportunityQuery>
) {
  const query: OpportunityQuery = {
    userProfile,
    limit: limit * 3,
    minScore: 60, // High match score required
    ...customFilters
  };

  const result = await matchOpportunities(query);
  
  // Prefer opportunities from less common sources or older postings
  const gems = result.opportunities
    .filter(opp => {
      // Prefer non-Adzuna sources (they're more common)
      if (opp.source === 'adzuna') return false;
      // Prefer opportunities that are a few days old (not brand new, not too old)
      const daysOld = (Date.now() - new Date(opp.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysOld >= 2 && daysOld <= 14;
    })
    .slice(0, limit);

  return {
    ...result,
    opportunities: gems.length > 0 ? gems : result.opportunities.slice(0, limit)
  };
}

/**
 * "Career Path" - Opportunities that build toward a specific career goal
 */
async function discoverCareerPath(
  userProfile: OpportunityQuery['userProfile'],
  limit: number,
  customFilters: Partial<OpportunityQuery>
) {
  if (!userProfile.goal) {
    // Fall back to "For You" if no goal specified
    return discoverForYou(userProfile, limit, customFilters);
  }

  const query: OpportunityQuery = {
    userProfile,
    limit: limit * 2,
    preferredTags: extractKeywordsFromGoal(userProfile.goal),
    minScore: 50,
    ...customFilters
  };

  const result = await matchOpportunities(query);
  
  // Prioritize opportunities that align with career goal
  const sorted = result.opportunities.sort((a, b) => {
    const goalAlignmentA = calculateGoalAlignment(a, userProfile.goal!);
    const goalAlignmentB = calculateGoalAlignment(b, userProfile.goal!);
    return goalAlignmentB - goalAlignmentA;
  });

  return {
    ...result,
    opportunities: sorted.slice(0, limit)
  };
}

/**
 * "Skill Builder" - Opportunities that help develop specific skills
 */
async function discoverSkillBuilder(
  userProfile: OpportunityQuery['userProfile'],
  limit: number,
  customFilters: Partial<OpportunityQuery>
) {
  // Focus on internships, volunteering, and events (skill-building opportunities)
  const query: OpportunityQuery = {
    userProfile,
    types: ['internship', 'volunteering', 'event'],
    limit: limit * 2,
    minScore: 40,
    ...customFilters
  };

  const result = await matchOpportunities(query);
  
  // Prioritize opportunities with learning/development focus
  const sorted = result.opportunities.sort((a, b) => {
    const learningA = hasLearningFocus(a);
    const learningB = hasLearningFocus(b);
    if (learningA && !learningB) return -1;
    if (!learningA && learningB) return 1;
    return (b.score || 0) - (a.score || 0);
  });

  return {
    ...result,
    opportunities: sorted.slice(0, limit)
  };
}

/**
 * "Location Scout" - Opportunities in specific locations
 */
async function discoverLocationScout(
  userProfile: OpportunityQuery['userProfile'],
  limit: number,
  customFilters: Partial<OpportunityQuery>
) {
  const query: OpportunityQuery = {
    userProfile,
    limit,
    location: {
      city: userProfile.city,
      country: userProfile.country,
      allowRemote: true // Include remote as well
    },
    ...customFilters
  };

  return await matchOpportunities(query);
}

/**
 * "Deadline Approaching" - Time-sensitive opportunities
 */
async function discoverDeadlineApproaching(
  userProfile: OpportunityQuery['userProfile'],
  limit: number,
  customFilters: Partial<OpportunityQuery>
) {
  const query: OpportunityQuery = {
    userProfile,
    limit: limit * 3,
    excludeExpired: true,
    ...customFilters
  };

  const result = await matchOpportunities(query);
  
  // Filter and sort by deadline proximity
  const withDeadlines = result.opportunities
    .filter(opp => opp.deadline)
    .map(opp => ({
      ...opp,
      daysUntilDeadline: Math.ceil(
        (new Date(opp.deadline!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    }))
    .filter(opp => opp.daysUntilDeadline >= 0 && opp.daysUntilDeadline <= 30) // Within 30 days
    .sort((a, b) => a.daysUntilDeadline - b.daysUntilDeadline); // Soonest first

  return {
    ...result,
    opportunities: withDeadlines.slice(0, limit)
  };
}

/**
 * Helper functions
 */

function getRecencyBoost(opportunity: Opportunity): number {
  const daysOld = (Date.now() - new Date(opportunity.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysOld <= 1) return 20;
  if (daysOld <= 3) return 15;
  if (daysOld <= 7) return 10;
  return 0;
}

function extractKeywordsFromGoal(goal: string): string[] {
  return goal
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !['the', 'and', 'or', 'to', 'for', 'with', 'from', 'become', 'be', 'a', 'an'].includes(word))
    .slice(0, 5);
}

function calculateGoalAlignment(opportunity: Opportunity, goal: string): number {
  const goalKeywords = extractKeywordsFromGoal(goal);
  const oppText = `${opportunity.title} ${opportunity.description}`.toLowerCase();
  
  const matches = goalKeywords.filter(kw => oppText.includes(kw));
  return (matches.length / goalKeywords.length) * 100;
}

function hasLearningFocus(opportunity: Opportunity): boolean {
  const text = `${opportunity.title} ${opportunity.description}`.toLowerCase();
  const learningKeywords = ['learn', 'training', 'mentorship', 'development', 'growth', 'education', 'workshop', 'course'];
  return learningKeywords.some(kw => text.includes(kw));
}


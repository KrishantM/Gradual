// Helper functions exported from matching engine for use in other modules

import { Opportunity, OpportunityQuery, UserProfileSnapshot } from '@/types/opportunities';

/**
 * Calculate a match score for an opportunity based on user profile
 * This is exported for use in insights generator
 */
export function calculateOpportunityScore(
  opportunity: Opportunity,
  profile: UserProfileSnapshot,
  query: OpportunityQuery
): number {
  const SCORE_WEIGHTS = {
    skillOverlap: 0.35,
    tagOverlap: 0.25,
    locationMatch: 0.20,
    goalAlignment: 0.10,
    recency: 0.10,
  };

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

function calculateSkillOverlapScore(
  opportunity: Opportunity,
  profile: UserProfileSnapshot
): number {
  if (!profile.skills || profile.skills.length === 0) {
    return 50;
  }
  
  const oppTags = opportunity.tags.map(t => t.toLowerCase());
  const userSkills = profile.skills.map(s => s.toLowerCase());
  
  let matches = 0;
  for (const skill of userSkills) {
    if (oppTags.some(tag => tag.includes(skill) || skill.includes(tag))) {
      matches++;
    }
  }
  
  const matchRatio = matches / userSkills.length;
  return matchRatio * 100;
}

function calculateTagOverlapScore(
  opportunity: Opportunity,
  profile: UserProfileSnapshot,
  query: OpportunityQuery
): number {
  const oppTags = opportunity.tags.map(t => t.toLowerCase());
  const profileTags: string[] = [];
  
  if (profile.tags) {
    profileTags.push(...profile.tags.map(t => t.toLowerCase()));
  }
  
  if (profile.interests) {
    const interestTags = profile.interests
      .toLowerCase()
      .split(/[,\s]+/)
      .filter(t => t.length > 2);
    profileTags.push(...interestTags);
  }
  
  if (profile.preferredIndustries) {
    const industryTags = profile.preferredIndustries
      .toLowerCase()
      .split(/[,\s]+/)
      .filter(t => t.length > 2);
    profileTags.push(...industryTags);
  }
  
  if (profile.degree) {
    const degreeTags = profile.degree
      .toLowerCase()
      .split(/\s+/)
      .filter(t => t.length > 3);
    profileTags.push(...degreeTags);
  }
  
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
  
  if (query.preferredTags && query.preferredTags.length > 0) {
    const preferredMatches = query.preferredTags.filter(prefTag => 
      oppTags.some(oppTag => 
        oppTag.includes(prefTag.toLowerCase()) || 
        prefTag.toLowerCase().includes(oppTag)
      )
    );
    if (preferredMatches.length > 0) {
      matches += preferredMatches.length * 2;
      totalRelevantTags += preferredMatches.length;
    }
  }
  
  if (totalRelevantTags === 0) {
    return 50;
  }
  
  return Math.min(100, (matches / totalRelevantTags) * 100);
}

function calculateLocationScore(
  opportunity: Opportunity,
  profile: UserProfileSnapshot,
  query: OpportunityQuery
): number {
  if (opportunity.isRemote) {
    if (query.location?.allowRemote) {
      return 80;
    }
    return 60;
  }
  
  if (profile.city && opportunity.city) {
    const profileCity = profile.city.toLowerCase();
    const oppCity = opportunity.city.toLowerCase();
    if (profileCity === oppCity || 
        profileCity.includes(oppCity) || 
        oppCity.includes(profileCity)) {
      return 100;
    }
  }
  
  if (profile.country && opportunity.country) {
    const profileCountry = profile.country.toLowerCase();
    const oppCountry = opportunity.country.toLowerCase();
    if (profileCountry === oppCountry) {
      return 70;
    }
  }
  
  if (profile.city && opportunity.location) {
    const profileCity = profile.city.toLowerCase();
    const oppLocation = opportunity.location.toLowerCase();
    if (oppLocation.includes(profileCity) || profileCity.includes(oppLocation)) {
      return 80;
    }
  }
  
  return 30;
}

function calculateGoalAlignmentScore(
  opportunity: Opportunity,
  profile: UserProfileSnapshot
): number {
  if (!profile.goal) {
    return 50;
  }
  
  const goalText = profile.goal.toLowerCase();
  const oppText = `${opportunity.title} ${opportunity.description} ${opportunity.category}`.toLowerCase();
  
  const goalKeywords = goalText
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !['the', 'and', 'or', 'to', 'for', 'with', 'from'].includes(word));
  
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
  
  return Math.max(20, 100 - daysOld * 0.5);
}


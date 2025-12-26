// AI-Powered Opportunity Insights Generator
// Generates personalized insights about why an opportunity matches a user

import { Opportunity, UserProfileSnapshot, OpportunityQuery } from '@/types/opportunities';
import { calculateOpportunityScore } from './matching-engine-helpers';

export interface OpportunityInsight {
  type: 'match' | 'skill-gap' | 'career-path' | 'readiness' | 'similar';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionable?: string; // Actionable advice
}

/**
 * Generate insights for an opportunity based on user profile
 * This provides AI-powered explanations for why an opportunity matches
 */
export function generateOpportunityInsights(
  opportunity: Opportunity,
  userProfile: UserProfileSnapshot,
  matchScore: number,
  query?: OpportunityQuery
): OpportunityInsight[] {
  const insights: OpportunityInsight[] = [];

  // 1. Match explanation
  insights.push(generateMatchInsight(opportunity, userProfile, matchScore, query));

  // 2. Skill gap analysis
  const skillGap = analyzeSkillGap(opportunity, userProfile);
  if (skillGap) {
    insights.push(skillGap);
  }

  // 3. Career path insight
  const careerPath = generateCareerPathInsight(opportunity, userProfile);
  if (careerPath) {
    insights.push(careerPath);
  }

  // 4. Application readiness
  insights.push(generateReadinessInsight(opportunity, userProfile, matchScore));

  return insights;
}

/**
 * Generate insight explaining why this opportunity matches
 */
function generateMatchInsight(
  opportunity: Opportunity,
  userProfile: UserProfileSnapshot,
  matchScore: number,
  query?: OpportunityQuery
): OpportunityInsight {
  const reasons: string[] = [];

  // Skill overlap
  const skillOverlap = calculateSkillOverlap(opportunity, userProfile);
  if (skillOverlap > 0.5) {
    reasons.push(`Strong skill match (${Math.round(skillOverlap * 100)}% overlap)`);
  }

  // Location match
  if (userProfile.city && opportunity.city) {
    if (userProfile.city.toLowerCase() === opportunity.city.toLowerCase()) {
      reasons.push('Perfect location match');
    } else if (opportunity.isRemote) {
      reasons.push('Remote opportunity - location flexible');
    }
  }

  // Goal alignment
  if (userProfile.goal && opportunity.description) {
    const goalKeywords = extractKeywords(userProfile.goal);
    const oppText = `${opportunity.title} ${opportunity.description}`.toLowerCase();
    const matches = goalKeywords.filter(kw => oppText.includes(kw.toLowerCase()));
    if (matches.length > 0) {
      reasons.push(`Aligns with your career goal`);
    }
  }

  // Tag overlap
  const tagOverlap = calculateTagOverlap(opportunity, userProfile);
  if (tagOverlap > 0.3) {
    reasons.push(`Strong interest alignment`);
  }

  const description = reasons.length > 0
    ? `This opportunity matches you because: ${reasons.join(', ')}.`
    : `This opportunity has a ${matchScore}% match score based on your profile.`;

  return {
    type: 'match',
    title: 'Why This Matches You',
    description,
    priority: matchScore > 70 ? 'high' : matchScore > 50 ? 'medium' : 'low'
  };
}

/**
 * Analyze skill gaps between user and opportunity requirements
 */
function analyzeSkillGap(
  opportunity: Opportunity,
  userProfile: UserProfileSnapshot
): OpportunityInsight | null {
  const userSkills = (userProfile.skills || []).map(s => s.toLowerCase());
  const oppTags = opportunity.tags.map(t => t.toLowerCase());

  // Find skills in opportunity that user doesn't have
  const missingSkills = oppTags.filter(tag => {
    // Check if user has this skill or a related skill
    return !userSkills.some(userSkill =>
      tag.includes(userSkill) || userSkill.includes(tag)
    );
  }).filter(tag => {
    // Filter out generic tags
    return !['job', 'internship', 'remote', 'full-time', 'part-time'].includes(tag);
  });

  if (missingSkills.length === 0) {
    return null; // No significant skill gaps
  }

  const topMissingSkills = missingSkills.slice(0, 3);

  return {
    type: 'skill-gap',
    title: 'Skills to Develop',
    description: `This opportunity requires skills you haven't listed yet: ${topMissingSkills.join(', ')}.`,
    priority: 'medium',
    actionable: `Consider learning or gaining experience with: ${topMissingSkills.join(', ')}. Look for courses, tutorials, or smaller projects to build these skills.`
  };
}

/**
 * Generate career path insight
 */
function generateCareerPathInsight(
  opportunity: Opportunity,
  userProfile: UserProfileSnapshot
): OpportunityInsight | null {
  if (!userProfile.goal) {
    return null;
  }

  const goalText = userProfile.goal.toLowerCase();
  const oppText = `${opportunity.title} ${opportunity.description}`.toLowerCase();

  // Check if this opportunity is a stepping stone
  const isSteppingStone = checkIfSteppingStone(opportunity, userProfile);

  if (isSteppingStone) {
    return {
      type: 'career-path',
      title: 'Career Path Fit',
      description: `This opportunity could be a stepping stone toward your goal: "${userProfile.goal}".`,
      priority: 'high',
      actionable: 'This role could help you gain experience and skills needed for your long-term career goal.'
    };
  }

  return null;
}

/**
 * Generate application readiness insight
 */
function generateReadinessInsight(
  opportunity: Opportunity,
  userProfile: UserProfileSnapshot,
  matchScore: number
): OpportunityInsight {
  let readiness: 'high' | 'medium' | 'low';
  let description: string;
  let actionable: string | undefined;

  if (matchScore >= 80) {
    readiness = 'high';
    description = 'You appear to be a strong candidate for this opportunity based on your profile.';
    actionable = 'Your skills and experience align well. Consider applying soon!';
  } else if (matchScore >= 60) {
    readiness = 'medium';
    description = 'You have a good foundation, but there may be some areas to strengthen.';
    actionable = 'Review the requirements and consider highlighting relevant experience in your application.';
  } else {
    readiness = 'low';
    description = 'This opportunity may require additional skills or experience.';
    actionable = 'Consider building relevant skills or gaining experience before applying, or look for similar entry-level opportunities.';
  }

  // Check for missing profile data
  const missingData: string[] = [];
  if (!userProfile.skills || userProfile.skills.length === 0) {
    missingData.push('skills');
  }
  if (!userProfile.bio) {
    missingData.push('bio');
  }
  if (!userProfile.goal) {
    missingData.push('career goal');
  }

  if (missingData.length > 0) {
    actionable = `${actionable} Also consider completing your profile: ${missingData.join(', ')}.`;
  }

  return {
    type: 'readiness',
    title: 'Application Readiness',
    description,
    priority: readiness === 'high' ? 'high' : 'medium',
    actionable
  };
}

/**
 * Helper functions
 */

function calculateSkillOverlap(opportunity: Opportunity, profile: UserProfileSnapshot): number {
  if (!profile.skills || profile.skills.length === 0) return 0;

  const userSkills = profile.skills.map(s => s.toLowerCase());
  const oppTags = opportunity.tags.map(t => t.toLowerCase());

  let matches = 0;
  for (const skill of userSkills) {
    if (oppTags.some(tag => tag.includes(skill) || skill.includes(tag))) {
      matches++;
    }
  }

  return matches / userSkills.length;
}

function calculateTagOverlap(opportunity: Opportunity, profile: UserProfileSnapshot): number {
  const profileTags: string[] = [];
  
  if (profile.interests) {
    profileTags.push(...extractKeywords(profile.interests));
  }
  if (profile.preferredIndustries) {
    profileTags.push(...extractKeywords(profile.preferredIndustries));
  }

  if (profileTags.length === 0) return 0;

  const oppTags = opportunity.tags.map(t => t.toLowerCase());
  const matches = profileTags.filter(tag =>
    oppTags.some(oppTag => oppTag.includes(tag.toLowerCase()) || tag.toLowerCase().includes(oppTag))
  ).length;

  return matches / profileTags.length;
}

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[,\s]+/)
    .filter(word => word.length > 3)
    .filter(word => !['the', 'and', 'or', 'of', 'in', 'at', 'to', 'for', 'with', 'by'].includes(word));
}

function checkIfSteppingStone(opportunity: Opportunity, profile: UserProfileSnapshot): boolean {
  // Simple heuristic: if opportunity type is internship and user is a student, it's likely a stepping stone
  if (opportunity.type === 'internship' && profile.university) {
    return true;
  }

  // If opportunity is entry-level and user is early in career
  const isEntryLevel = opportunity.tags.some(tag =>
    ['graduate', 'junior', 'entry level', 'internship'].includes(tag.toLowerCase())
  );
  if (isEntryLevel && (!profile.yearOfStudy || profile.yearOfStudy <= 3)) {
    return true;
  }

  return false;
}

/**
 * Find similar opportunities (would need access to all opportunities)
 * This is a placeholder - would need to be implemented with access to opportunity database
 */
export function findSimilarOpportunities(
  opportunity: Opportunity,
  allOpportunities: Opportunity[],
  limit: number = 5
): Opportunity[] {
  // Find opportunities with similar tags, category, or type
  const similar = allOpportunities
    .filter(opp => opp.id !== opportunity.id)
    .filter(opp => 
      opp.type === opportunity.type ||
      opp.category === opportunity.category ||
      opp.tags.some(tag => opportunity.tags.includes(tag))
    )
    .slice(0, limit);

  return similar;
}


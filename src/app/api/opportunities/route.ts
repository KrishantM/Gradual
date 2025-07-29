import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

// Firebase init (only if not already initialized)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!getApps().length) initializeApp(firebaseConfig);
const db = getFirestore();

// Scoring weights for different factors
const SCORE_WEIGHTS = {
  keywordMatch: 0.4,      // 40% - Skills, interests, degree relevance
  locationMatch: 0.25,    // 25% - City/country matching
  typeMatch: 0.2,         // 20% - Internship vs job preference
  recency: 0.15,          // 15% - How recent the posting is
};

// Keywords that indicate different career fields
const CAREER_KEYWORDS = {
  'software': ['software', 'developer', 'programming', 'coding', 'javascript', 'python', 'java', 'react', 'node', 'fullstack', 'frontend', 'backend', 'web', 'mobile', 'app'],
  'data': ['data', 'analytics', 'science', 'machine learning', 'ai', 'artificial intelligence', 'statistics', 'python', 'sql', 'r', 'tableau', 'powerbi'],
  'finance': ['finance', 'banking', 'investment', 'accounting', 'trading', 'risk', 'compliance', 'audit', 'tax', 'financial'],
  'marketing': ['marketing', 'digital', 'social media', 'content', 'brand', 'advertising', 'seo', 'sem', 'growth', 'campaign'],
  'consulting': ['consulting', 'strategy', 'management', 'business', 'operations', 'process', 'improvement', 'advisory'],
  'design': ['design', 'ux', 'ui', 'user experience', 'graphic', 'creative', 'visual', 'product design'],
  'sales': ['sales', 'business development', 'account', 'client', 'relationship', 'revenue', 'b2b', 'b2c'],
  'hr': ['hr', 'human resources', 'recruitment', 'talent', 'people', 'employee', 'workforce', 'hiring'],
  'operations': ['operations', 'logistics', 'supply chain', 'procurement', 'manufacturing', 'production', 'quality'],
  'research': ['research', 'analysis', 'study', 'investigation', 'academic', 'laboratory', 'scientific', 'methodology']
};

interface Opportunity {
  id: string;
  title: string;
  description: string;
  location: string;
  company: string;
  url: string;
  type: 'internship' | 'job';
  category: string;
  created: string;
  salary_min?: number;
  salary_max?: number;
  source: string;
  score?: number;
}

interface UserProfile {
  fullName: string;
  university: string;
  degree: string;
  gpa: string;
  interests: string;
  bio: string;
  city: string;
  country: string;
  age: string;
  preferredIndustries: string;
  portfolioLinks: string;
}

// Calculate keyword match score
function calculateKeywordScore(opportunity: Opportunity, profile: UserProfile): number {
  const searchText = `${opportunity.title} ${opportunity.description} ${opportunity.category}`.toLowerCase();
  const profileText = `${profile.degree} ${profile.interests} ${profile.bio} ${profile.preferredIndustries}`.toLowerCase();
  
  let score = 0;
  let totalKeywords = 0;
  
  // Check for career field keywords
  for (const [field, keywords] of Object.entries(CAREER_KEYWORDS)) {
    const fieldInProfile = profileText.includes(field) || 
                          profile.preferredIndustries.toLowerCase().includes(field);
    
    if (fieldInProfile) {
      const matchingKeywords = keywords.filter(keyword => 
        searchText.includes(keyword.toLowerCase())
      );
      
      if (matchingKeywords.length > 0) {
        score += (matchingKeywords.length / keywords.length) * 100;
        totalKeywords++;
      }
    }
  }
  
  // Check for degree-specific keywords
  const degreeKeywords = profile.degree.toLowerCase().split(' ');
  const degreeMatches = degreeKeywords.filter(keyword => 
    searchText.includes(keyword) && keyword.length > 3
  );
  
  if (degreeMatches.length > 0) {
    score += (degreeMatches.length / degreeKeywords.length) * 50;
    totalKeywords++;
  }
  
  // Check for interest keywords
  const interestKeywords = profile.interests.toLowerCase().split(/[,\s]+/);
  const interestMatches = interestKeywords.filter(keyword => 
    searchText.includes(keyword) && keyword.length > 3
  );
  
  if (interestMatches.length > 0) {
    score += (interestMatches.length / interestKeywords.length) * 30;
    totalKeywords++;
  }
  
  return totalKeywords > 0 ? score / totalKeywords : 0;
}

// Calculate location match score
function calculateLocationScore(opportunity: Opportunity, profile: UserProfile): number {
  const oppLocation = opportunity.location.toLowerCase();
  const userCity = profile.city.toLowerCase();
  const userCountry = profile.country.toLowerCase();
  
  // Exact city match
  if (oppLocation.includes(userCity)) return 100;
  
  // Country match
  if (oppLocation.includes(userCountry)) return 70;
  
  // Partial city match (e.g., "London" in "Greater London")
  if (userCity.length > 3 && oppLocation.includes(userCity.substring(0, userCity.length - 2))) return 50;
  
  // Remote work indicators
  if (oppLocation.includes('remote') || oppLocation.includes('work from home') || oppLocation.includes('wfh')) return 60;
  
  return 0;
}

// Calculate type match score
function calculateTypeScore(opportunity: Opportunity, profile: UserProfile): number {
  // For now, assume students prefer internships
  // You could add a preference field to the profile later
  const isStudent = profile.university && profile.degree;
  
  if (isStudent && opportunity.type === 'internship') return 100;
  if (!isStudent && opportunity.type === 'job') return 100;
  
  return 50; // Neutral score for other combinations
}

// Calculate recency score
function calculateRecencyScore(opportunity: Opportunity): number {
  const created = new Date(opportunity.created);
  const now = new Date();
  const daysOld = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysOld <= 7) return 100;
  if (daysOld <= 14) return 90;
  if (daysOld <= 30) return 80;
  if (daysOld <= 60) return 60;
  
  return Math.max(20, 100 - daysOld);
}

// Main scoring function
function calculateOpportunityScore(opportunity: Opportunity, profile: UserProfile): number {
  const keywordScore = calculateKeywordScore(opportunity, profile);
  const locationScore = calculateLocationScore(opportunity, profile);
  const typeScore = calculateTypeScore(opportunity, profile);
  const recencyScore = calculateRecencyScore(opportunity);
  
  const totalScore = 
    keywordScore * SCORE_WEIGHTS.keywordMatch +
    locationScore * SCORE_WEIGHTS.locationMatch +
    typeScore * SCORE_WEIGHTS.typeMatch +
    recencyScore * SCORE_WEIGHTS.recency;
  
  return Math.round(totalScore);
}

export async function POST(req: NextRequest) {
  try {
    const { profile, limit: limitCount = 10 } = await req.json();
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile is required' }, { status: 400 });
    }
    
    // Fetch opportunities from Firestore
    const opportunitiesRef = collection(db, 'opportunities');
    const q = query(
      opportunitiesRef,
      orderBy('created', 'desc'),
      limit(100) // Fetch last 100 opportunities for scoring
    );
    
    const querySnapshot = await getDocs(q);
    const opportunities: Opportunity[] = [];
    
    querySnapshot.forEach((doc) => {
      opportunities.push({
        id: doc.id,
        ...doc.data()
      } as Opportunity);
    });
    
    // Score each opportunity
    const scoredOpportunities = opportunities.map(opportunity => ({
      ...opportunity,
      score: calculateOpportunityScore(opportunity, profile)
    }));
    
    // Filter by minimum score and sort by score
    const relevantOpportunities = scoredOpportunities
      .filter(opp => opp.score >= 0) // Temporarily show all opportunities for testing
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, limitCount);
    
    return NextResponse.json({ 
      opportunities: relevantOpportunities,
      totalScored: opportunities.length,
      totalRelevant: relevantOpportunities.length
    });
    
  } catch (error) {
    console.error('Opportunity matching error:', error);
    return NextResponse.json({ error: 'Failed to fetch opportunities' }, { status: 500 });
  }
} 
// Opportunities Engine Insights API
// Generates AI-powered insights for specific opportunities

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../lib/firebase-admin';
import { generateOpportunityInsights } from '@/lib/opportunities-engine/insights-generator';
import { Opportunity, UserProfileSnapshot, OpportunityQuery } from '@/types/opportunities';
import { calculateOpportunityScore } from '@/lib/opportunities-engine/matching-engine-helpers';

/**
 * POST /api/opportunities-engine/insights
 * 
 * Generates insights for a specific opportunity based on user profile.
 * 
 * Request body:
 * {
 *   opportunity: Opportunity,
 *   userProfile: UserProfileSnapshot,
 *   query?: OpportunityQuery (optional)
 * }
 * 
 * Response:
 * {
 *   insights: OpportunityInsight[],
 *   matchScore: number
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify the Firebase token
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { opportunity, userProfile, query } = body;

    // Validate required fields
    if (!opportunity) {
      return NextResponse.json(
        { error: 'opportunity is required' },
        { status: 400 }
      );
    }

    if (!userProfile) {
      return NextResponse.json(
        { error: 'userProfile is required' },
        { status: 400 }
      );
    }

    if (!userProfile.uid) {
      return NextResponse.json(
        { error: 'userProfile.uid is required' },
        { status: 400 }
      );
    }

    // Ensure the user can only query their own profile
    if (userProfile.uid !== decodedToken.uid) {
      return NextResponse.json(
        { error: 'Forbidden - Cannot query other users\' profiles' },
        { status: 403 }
      );
    }

    // Calculate match score
    const matchScore = calculateOpportunityScore(
      opportunity as Opportunity,
      userProfile as UserProfileSnapshot,
      query as OpportunityQuery || { userProfile: userProfile as UserProfileSnapshot }
    );

    // Generate insights
    const insights = generateOpportunityInsights(
      opportunity as Opportunity,
      userProfile as UserProfileSnapshot,
      matchScore,
      query as OpportunityQuery
    );

    // Return the results
    return NextResponse.json({
      insights,
      matchScore,
      opportunity: {
        id: opportunity.id,
        title: opportunity.title,
        type: opportunity.type
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Opportunities Engine insights error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate insights',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/opportunities-engine/insights
 * 
 * Returns API documentation.
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: 'Opportunities Engine Insights API',
    description: 'POST to this endpoint to generate AI-powered insights for an opportunity',
    endpoint: '/api/opportunities-engine/insights',
    method: 'POST',
    authentication: 'Bearer token required (Firebase ID token)',
    requestBody: {
      opportunity: 'Opportunity object (required)',
      userProfile: 'UserProfileSnapshot object (required)',
      query: 'OpportunityQuery object (optional)'
    },
    response: {
      insights: 'OpportunityInsight[] - Array of insights about the opportunity',
      matchScore: 'number - Calculated match score',
      opportunity: 'Object with id, title, and type'
    },
    insightTypes: {
      match: 'Explains why the opportunity matches the user',
      'skill-gap': 'Identifies skills the user needs to develop',
      'career-path': 'Shows how the opportunity fits into career progression',
      readiness: 'Assesses application readiness',
      similar: 'Finds similar opportunities'
    }
  }, { status: 200 });
}


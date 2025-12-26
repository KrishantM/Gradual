// Opportunities Engine API Route
// This endpoint provides opportunity matching functionality using the Opportunities Engine
// NOTE: This is a mock-only implementation. Real data integration will be added later.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../lib/firebase-admin';
import { matchOpportunities } from '@/lib/opportunities-engine/matching-engine';
import { OpportunityQuery } from '@/types/opportunities';

/**
 * POST /api/opportunities-engine/match
 * 
 * Matches opportunities based on user profile and query criteria.
 * 
 * Request body:
 * {
 *   userProfile: UserProfileSnapshot,
 *   types?: OpportunityType[],
 *   location?: { city?: string, country?: string, allowRemote?: boolean },
 *   requiredTags?: string[],
 *   preferredTags?: string[],
 *   excludeExpired?: boolean,
 *   minDate?: string,
 *   maxDate?: string,
 *   limit?: number,
 *   minScore?: number
 * }
 * 
 * Response:
 * {
 *   opportunities: Opportunity[],
 *   totalMatches: number,
 *   query: OpportunityQuery,
 *   metadata?: { executionTimeMs?: number, filtersApplied?: string[] }
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
    const {
      userProfile,
      types,
      location,
      requiredTags,
      preferredTags,
      excludeExpired,
      minDate,
      maxDate,
      limit,
      minScore
    } = body;

    // Validate required fields
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
    // (In production, you might want to allow admins to query other profiles)
    if (userProfile.uid !== decodedToken.uid) {
      return NextResponse.json(
        { error: 'Forbidden - Cannot query other users\' profiles' },
        { status: 403 }
      );
    }

    // Build the query object
    const query: OpportunityQuery = {
      userProfile: {
        uid: userProfile.uid,
        university: userProfile.university,
        degree: userProfile.degree,
        gpa: userProfile.gpa,
        interests: userProfile.interests,
        preferredIndustries: userProfile.preferredIndustries,
        bio: userProfile.bio,
        goal: userProfile.goal,
        city: userProfile.city,
        country: userProfile.country,
        skills: userProfile.skills,
        tags: userProfile.tags,
        age: userProfile.age,
        yearOfStudy: userProfile.yearOfStudy
      },
      types,
      location,
      requiredTags,
      preferredTags,
      excludeExpired: excludeExpired !== undefined ? excludeExpired : true,
      minDate,
      maxDate,
      limit: limit ? Math.min(limit, 100) : 20, // Cap at 100 for performance
      minScore
    };

    // Run the matching engine (now async)
    const result = await matchOpportunities(query);

    // Return the results
    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('Opportunities Engine matching error:', error);
    return NextResponse.json(
      {
        error: 'Failed to match opportunities',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/opportunities-engine/match
 * 
 * Returns API documentation and example usage.
 * This is useful for testing and understanding the API.
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: 'Opportunities Engine Matching API',
    description: 'POST to this endpoint to match opportunities based on user profile',
    endpoint: '/api/opportunities-engine/match',
    method: 'POST',
    authentication: 'Bearer token required (Firebase ID token)',
    requestBody: {
      userProfile: {
        uid: 'string (required)',
        university: 'string (optional)',
        degree: 'string (optional)',
        gpa: 'number (optional)',
        interests: 'string (optional)',
        preferredIndustries: 'string (optional)',
        bio: 'string (optional)',
        goal: 'string (optional)',
        city: 'string (optional)',
        country: 'string (optional)',
        skills: 'string[] (optional)',
        tags: 'string[] (optional)',
        age: 'number (optional)',
        yearOfStudy: 'number (optional)'
      },
      types: 'OpportunityType[] (optional) - Filter by opportunity types',
      location: {
        city: 'string (optional)',
        country: 'string (optional)',
        allowRemote: 'boolean (optional)'
      },
      requiredTags: 'string[] (optional) - Must have at least one of these tags',
      preferredTags: 'string[] (optional) - Boost score for these tags',
      excludeExpired: 'boolean (optional, default: true)',
      minDate: 'string (optional, ISO date)',
      maxDate: 'string (optional, ISO date)',
      limit: 'number (optional, default: 20, max: 100)',
      minScore: 'number (optional, default: 0)'
    },
    response: {
      opportunities: 'Opportunity[] - Ranked list of matched opportunities',
      totalMatches: 'number - Total number of matches found',
      query: 'OpportunityQuery - The query that was executed',
      metadata: {
        executionTimeMs: 'number - Execution time in milliseconds',
        filtersApplied: 'string[] - List of filters that were applied'
      }
    },
    example: {
      request: {
        userProfile: {
          uid: 'user123',
          university: 'University of Auckland',
          degree: 'Computer Science',
          city: 'Auckland',
          country: 'New Zealand',
          skills: ['javascript', 'react', 'python'],
          interests: 'web development, machine learning',
          goal: 'Become a full-stack developer'
        },
        types: ['job', 'internship'],
        location: {
          city: 'Auckland',
          allowRemote: true
        },
        limit: 10
      }
    },
    note: 'This is a mock-only implementation. Real data integration will be added later.'
  }, { status: 200 });
}


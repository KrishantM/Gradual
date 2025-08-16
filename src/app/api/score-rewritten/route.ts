// src/app/api/score-rewritten/route.ts

import { openai } from '../../../../lib/openai';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../lib/firebase-admin';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the Firebase token
    try {
      await auth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    const { rewrittenCV, originalScore, originalFeedback } = await req.json();

    if (!rewrittenCV || typeof rewrittenCV !== 'string') {
      return NextResponse.json({ error: 'Invalid rewritten CV text.' }, { status: 400 });
    }

    // WORD COUNT VALIDATION - Enforce minimum and maximum limits
    const normalizedCvText = rewrittenCV.trim().toLowerCase();
    const wordCount = normalizedCvText.split(/\s+/).length;
    
    // Check maximum word count (1500 words)
    if (wordCount > 1500) {
      return NextResponse.json({ 
        error: 'Rewritten CV is too long. Maximum allowed is 1500 words. Please shorten your CV to focus on the most relevant information.',
        wordCount: wordCount,
        maxAllowed: 1500
      }, { status: 400 });
    }
    
    // Check minimum word count (at least 10 words to prevent abuse)
    if (wordCount < 10) {
      return NextResponse.json({ 
        error: 'Rewritten CV is too short. Please provide at least 10 words for evaluation.',
        wordCount: wordCount,
        minRequired: 10
      }, { status: 400 });
    }

    // Extract the original score number from the feedback text
    let originalScoreNumber = 0;
    try {
      const scoreMatch = originalScore.match(/Overall Score \(0–100\): (\d+)/);
      if (scoreMatch) {
        originalScoreNumber = parseInt(scoreMatch[1]);
      } else {
        // Fallback: try to find any number in the text
        const fallbackMatch = originalScore.match(/(\d+)/);
        if (fallbackMatch) {
          originalScoreNumber = parseInt(fallbackMatch[1]);
        }
      }
    } catch (error) {
      console.error('Error parsing original score:', error);
      originalScoreNumber = 50; // Default fallback
    }

    // USE EXACTLY THE SAME SCORING ALGORITHM AS THE MAIN SCORE ENDPOINT
    // Create a deterministic but balanced scoring system
    // Use a combination of hash and content analysis for consistency
    const cvHash = crypto.createHash('sha256').update(rewrittenCV.trim().toLowerCase()).digest('hex');
    
    // CONTENT QUALITY VALIDATION - Check if CV meets minimum standards
    // Quality Gate 1: Minimum content length
    let adjustedScore = 0; // Initialize adjustedScore
    if (wordCount < 50) {
      // Extremely short CVs get very low scores (0-5)
      const baseScore = parseInt(cvHash.substring(0, 2), 16) % 6; // 0-5 range
      adjustedScore = baseScore;
    } else if (wordCount < 100) {
      // Very short CVs get low scores (5-10)
      const baseScore = 5 + (parseInt(cvHash.substring(0, 2), 16) % 6); // 5-10 range
      adjustedScore = baseScore;
    } else if (wordCount < 300) {
      // Short CVs get moderate scores (10-50)
      const baseScore = 10 + (parseInt(cvHash.substring(0, 3), 16) % 41); // 10-50 range
      adjustedScore = baseScore;
    } else {
      // Normal CVs (300+ words) use the balanced scoring system
      const hashValue = parseInt(cvHash.substring(0, 8), 16);
      const baseScore = 60 + (hashValue % 31); // Base score between 60-90 for most CVs (more realistic)
      adjustedScore = baseScore;
    }
    
    // Quality Gate 2: Content appropriateness check
    const inappropriateWords = [
      'fuck', 'shit', 'bitch', 'ass', 'damn', 'hell', 'crap', 'piss', 'dick', 'cock',
      'pussy', 'vagina', 'penis', 'sex', 'sexual', 'porn', 'nude', 'naked', 'drugs',
      'cocaine', 'heroin', 'marijuana', 'weed', 'alcohol', 'drunk', 'kill', 'murder',
      'hate', 'racist', 'sexist', 'homophobic', 'nazi', 'terrorist', 'bomb', 'gun'
    ];
    
    // More precise filtering to avoid false positives
    const hasInappropriateContent = inappropriateWords.some(word => {
      // Use word boundaries to avoid matching substrings
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      return regex.test(normalizedCvText);
    });
    
    // Debug: Check which words might be triggering the filter
    const potentialTriggers = inappropriateWords.filter(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      return regex.test(normalizedCvText);
    });
    
    // TEMPORARILY DISABLED: Inappropriate content check to debug scoring issue
    // if (hasInappropriateContent) {
    //   // Offensive content gets very low scores
    //   adjustedScore = Math.max(10, Math.min(25, adjustedScore * 0.3));
    // }
    
    // Quality Gate 3: Professional content validation
    const professionalIndicators = [
      'experience', 'skills', 'education', 'work', 'job', 'career', 'professional',
      'responsibilities', 'achievements', 'leadership', 'project', 'team', 'results',
      'developed', 'managed', 'implemented', 'created', 'designed', 'analyzed',
      'years', 'months', 'company', 'organization', 'position', 'role', 'industry',
      'certification', 'training', 'workshop', 'conference', 'publication', 'research'
    ];
    
    const professionalScore = professionalIndicators.filter(indicator => 
      normalizedCvText.includes(indicator)
    ).length;
    
    // If CV lacks professional indicators, reduce score significantly
    if (professionalScore < 4) { // Increased from 3 to 4
      adjustedScore = Math.max(15, adjustedScore * 0.5); // More aggressive penalty
    } else if (professionalScore < 6) { // New tier for moderate quality
      adjustedScore = Math.max(25, adjustedScore * 0.8);
    }
    
    // Quality Gate 4: Structure validation
    const hasContactInfo = /(email|phone|address|linkedin)/i.test(rewrittenCV);
    const hasExperience = /(experience|work|employment|job)/i.test(rewrittenCV);
    const hasEducation = /(education|degree|university|college)/i.test(rewrittenCV);
    const hasSkills = /(skills|technologies|tools|languages)/i.test(rewrittenCV);
    const hasDates = /(20\d{2}|19\d{2}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(rewrittenCV);
    const hasNumbers = /(\d+)/.test(rewrittenCV); // Years of experience, percentages, etc.
    
    const structureScore = [hasContactInfo, hasExperience, hasEducation, hasSkills, hasDates, hasNumbers]
      .filter(Boolean).length;
    
    // If CV lacks basic structure, reduce score
    if (structureScore < 3) { // Increased from 2 to 3
      adjustedScore = Math.max(20, adjustedScore * 0.6); // More aggressive penalty
    } else if (structureScore < 4) { // New tier for moderate structure
      adjustedScore = Math.max(30, adjustedScore * 0.8);
    }
    
    // Only apply normal heuristics to CVs that pass quality gates
    if (wordCount >= 300 && professionalScore >= 4 && structureScore >= 3) { // Updated thresholds
      // Apply CV quality heuristics with more critical adjustments
      
      // Length factor (more nuanced)
      if (wordCount < 200) adjustedScore = Math.max(adjustedScore - 8, 0); // More penalty for short CVs
      else if (wordCount > 800) adjustedScore = Math.max(adjustedScore - 10, 0); // More penalty for very long CVs
      else if (wordCount >= 300 && wordCount <= 600) adjustedScore = Math.min(adjustedScore + 2, 100); // Reduced bonus
      
      // Professional keywords factor (more balanced)
      const professionalKeywords = ['experience', 'skills', 'education', 'achievements', 'leadership', 'project', 'team', 'results', 'improved', 'developed', 'managed', 'responsibilities', 'collaboration', 'communication', 'problem solving', 'analytical', 'strategic', 'innovation'];
      const keywordMatches = professionalKeywords.filter(keyword => 
        normalizedCvText.includes(keyword)
      ).length;
      // More reasonable keyword bonus
      adjustedScore = Math.min(adjustedScore + Math.min(keywordMatches, 5), 100); // Reduced from 8 to 5
      
      // Structure factor bonuses (reduced)
      if (hasContactInfo) adjustedScore = Math.min(adjustedScore + 1, 100); // Reduced from 2 to 1
      if (hasExperience) adjustedScore = Math.min(adjustedScore + 2, 100); // Reduced from 3 to 2
      if (hasEducation) adjustedScore = Math.min(adjustedScore + 1, 100); // Reduced from 2 to 1
      if (hasSkills) adjustedScore = Math.min(adjustedScore + 2, 100); // Reduced from 3 to 2
    }
    
    // Ensure score is within appropriate bounds based on quality
    if (wordCount < 50) {
      adjustedScore = Math.max(0, Math.min(5, Math.round(adjustedScore)));
    } else if (wordCount < 100) {
      adjustedScore = Math.max(5, Math.min(10, Math.round(adjustedScore)));
    } else if (wordCount < 300) {
      adjustedScore = Math.max(10, Math.min(50, Math.round(adjustedScore)));
    } else {
      // For CVs with 300+ words, allow the full range but apply quality penalties
      if (professionalScore < 4 || structureScore < 3) { // Updated thresholds
        // Apply quality penalties but don't force into lower ranges
        adjustedScore = Math.max(30, Math.min(85, Math.round(adjustedScore))); // Reduced from 40-95 to 30-85
      } else {
        // Full scoring range for high-quality CVs
        adjustedScore = Math.max(50, Math.min(90, Math.round(adjustedScore))); // Reduced from 60-95 to 50-90
      }
    }

    // Debug logging
    console.log('CV Scoring Debug:', {
      wordCount,
      hasInappropriateContent,
      potentialTriggers: potentialTriggers.length > 0 ? potentialTriggers : 'None',
      professionalScore,
      structureScore,
      finalScore: adjustedScore,
      originalBaseScore: wordCount >= 300 ? 60 + (parseInt(cvHash.substring(0, 8), 16) % 31) : 'N/A'
    });

    const systemPrompt = `You are an AI CV scoring assistant. You need to score the rewritten CV and provide a comparison with the original score.

IMPORTANT: You must respond in this EXACT format:

NEW SCORE (0–100): ${adjustedScore}

SCORE BREAKDOWN:
1. Professionalism: [1–2 sentence explanation, and score out of 25]
2. Experience: [1–2 sentence explanation, and score out of 25]
3. Keyword Screening: [1–2 sentence explanation, and score out of 25]
4. Relevance to Target Role: [1–2 sentence explanation, and score out of 25]

IMPROVEMENT ANALYSIS:
[Compare the new score of ${adjustedScore} with the original score of ${originalScoreNumber} and explain what improvements were made. The rewritten CV should show improvement in areas identified in the original feedback.]

OVERALL ASSESSMENT:
[2-3 sentences summarizing the effectiveness of the rewrite and remaining areas for improvement]

CRITICAL REQUIREMENTS:
1. The NEW SCORE must be exactly ${adjustedScore}
2. The four section scores (Professionalism + Experience + Keyword Screening + Relevance) must add up to exactly ${adjustedScore}
3. Each section score should be between 1-25 points (1 for extremely poor quality, 25 for excellent)
4. Do not include any introduction or closing remarks
5. Do not break from this format`;

    const userPrompt = `Here is the rewritten CV:

${rewrittenCV}

Original Score: ${originalScoreNumber}
Original Feedback: ${originalFeedback}

Please score this rewritten CV and provide a comparison with the original. The rewritten CV should demonstrate improvements based on the original feedback.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0, // Maximum consistency
      max_tokens: 600,
    });

    const newScore = response.choices[0].message?.content || '';
    return NextResponse.json({ 
      newScore, 
      cvHash: cvHash,
      originalScoreNumber: originalScoreNumber,
      adjustedScore: adjustedScore
    }); // Return additional debug info
  } catch (err) {
    console.error('OpenAI API Error:', err);
    return NextResponse.json({ error: 'Failed to generate new score' }, { status: 500 });
  }
}

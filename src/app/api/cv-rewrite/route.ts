// src/app/api/cv-rewrite/route.ts
// AI-POWERED CV IMPROVEMENT WITH CONSISTENCY TRACKING
// This endpoint rewrites CVs to score higher through genuine content improvements
// NEW: Generates unique rewrite IDs embedded in CV text for perfect scoring consistency
// The scoring system uses these IDs to ensure the same rewritten CV always gets the same score

import { openai } from '../../../../lib/openai';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../lib/firebase-admin';

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

    const { cvText, scoreFeedback, targetRole, guest, originalScore } = await req.json();

    if (!cvText || typeof cvText !== 'string') {
      return NextResponse.json({ error: 'Invalid CV text.' }, { status: 400 });
    }

    // WORD COUNT VALIDATION - Enforce minimum and maximum limits
    const normalizedCvText = cvText.trim().toLowerCase();
    const wordCount = normalizedCvText.split(/\s+/).length;
    
    // Check maximum word count (1500 words)
    if (wordCount > 1500) {
      return NextResponse.json({ 
        error: 'CV is too long. Maximum allowed is 1500 words. Please shorten your CV to focus on the most relevant information.',
        wordCount: wordCount,
        maxAllowed: 1500
      }, { status: 400 });
    }
    
    // Check minimum word count (at least 10 words to prevent abuse)
    if (wordCount < 10) {
      return NextResponse.json({ 
        error: 'CV is too short. Please provide at least 10 words for evaluation.',
        wordCount: wordCount,
        minRequired: 10
      }, { status: 400 });
    }

    // Use default feedback if none provided (for standalone rewrite feature)
    const feedbackToUse = scoreFeedback || 'Please improve this CV by enhancing language clarity, adding quantifiable achievements, using action verbs, and making it more ATS-friendly while maintaining professional tone.';

    // Generate a unique rewritten CV ID for consistency tracking
    const rewrittenCVId = `REWRITE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const systemPrompt = `You are an expert CV writer and career coach. Your task is to rewrite the provided CV based on the feedback given, making it more professional, impactful, and aligned with modern CV standards.

CRITICAL REQUIREMENTS:
1. The rewritten CV MUST score higher than the original through genuine content improvements
2. Focus on the specific feedback areas mentioned in the score feedback
3. Use action verbs and quantifiable achievements (e.g., "Increased sales by 25%", "Managed team of 10 people")
4. Maintain professional tone and ATS-friendly formatting
5. Keep the same length or slightly shorter
6. Ensure the CV addresses ALL areas mentioned in the feedback
7. **CRITICAL**: Add the unique rewrite ID at the very end of the rewritten CV

SCORING IMPROVEMENT STRATEGIES (Based on the CV scoring algorithm):
- **Professional Indicators**: Include more professional terms like 'experience', 'skills', 'education', 'achievements', 'leadership', 'project', 'team', 'results', 'developed', 'managed', 'implemented', 'created', 'designed', 'analyzed', 'years', 'months', 'company', 'organization', 'position', 'role', 'industry', 'certification', 'training', 'workshop', 'conference', 'publication', 'research'
- **Structure Elements**: Ensure the CV has contact info, experience, education, skills, dates, and numbers
- **Action Verbs**: Use strong action verbs like 'developed', 'implemented', 'managed', 'led', 'created', 'designed', 'analyzed', 'improved', 'increased', 'reduced', 'achieved', 'delivered', 'coordinated', 'facilitated'
- **Quantifiable Achievements**: Add specific numbers, percentages, and metrics
- **Professional Keywords**: Include industry-specific terms and comprehensive professional vocabulary

IMPORTANT: You must respond in this EXACT format:

REWRITTEN CV:
[The complete rewritten CV with all improvements applied]

[Add this line at the very end of the rewritten CV:]

REWRITE ID: ${rewrittenCVId}

CHANGES MADE:
[Bullet-point list of specific changes made to improve the CV]

IMPROVEMENT SUMMARY:
[2-3 sentences summarizing the key improvements and their impact]

Do not include any other text outside of the specified format.`;

    const userPrompt = `Original CV:
${cvText}

CV Score Feedback:
${feedbackToUse}

${targetRole ? `Target Role: ${targetRole}` : ''}

Please rewrite this CV based on the feedback provided. Focus on the specific areas mentioned in the feedback to ensure the rewritten CV scores higher than the original through genuine content improvements. The scoring system will ensure consistency while guaranteeing improvement.`;

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
      temperature: 0.7,
      max_tokens: 4000,
    });

    const rewriteResult = response.choices[0].message?.content || '';
    
    // Parse the response to extract different sections
    const sections = {
      rewrittenCV: '',
      changesMade: '',
      improvementSummary: '',
      rewriteId: rewrittenCVId // Include the generated ID
    };

    if (rewriteResult.includes('REWRITTEN CV:')) {
      const cvMatch = rewriteResult.match(/REWRITTEN CV:\s*([\s\S]*?)(?=CHANGES MADE:|$)/);
      if (cvMatch) {
        let cvText = cvMatch[1].trim();
        
        // Extract the rewrite ID from the CV text if present
        const idMatch = cvText.match(/REWRITE ID:\s*([A-Z0-9_]+)/);
        if (idMatch) {
          sections.rewriteId = idMatch[1];
          // Remove the rewrite ID from the CV text for display
          cvText = cvText.replace(/REWRITE ID:\s*[A-Z0-9_]+/, '').trim();
        }
        
        sections.rewrittenCV = cvText;
      }
    }

    if (rewriteResult.includes('CHANGES MADE:')) {
      const changesMatch = rewriteResult.match(/CHANGES MADE:\s*([\s\S]*?)(?=IMPROVEMENT SUMMARY:|$)/);
      if (changesMatch) sections.changesMade = changesMatch[1].trim();
    }

    if (rewriteResult.includes('IMPROVEMENT SUMMARY:')) {
      const summaryMatch = rewriteResult.match(/IMPROVEMENT SUMMARY:\s*([\s\S]*?)$/);
      if (summaryMatch) sections.improvementSummary = summaryMatch[1].trim();
    }

    return NextResponse.json({ 
      rewriteResult: rewriteResult,
      sections: sections
    });
  } catch (err) {
    console.error('OpenAI API Error:', err);
    return NextResponse.json({ error: 'Failed to generate CV rewrite' }, { status: 500 });
  }
}

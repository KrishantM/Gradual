// src/app/api/cv-rewrite/route.ts

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

    const { cvText, scoreFeedback, targetRole, guest } = await req.json();

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

    if (!scoreFeedback || typeof scoreFeedback !== 'string') {
      return NextResponse.json({ error: 'Invalid score feedback.' }, { status: 400 });
    }

    const systemPrompt = `You are an expert CV writer and career coach. Your task is to rewrite the provided CV based on the feedback given, making it more professional, impactful, and aligned with modern CV standards.

CRITICAL REQUIREMENTS:
1. The rewritten CV MUST score higher than the original
2. Focus on the specific feedback areas mentioned in the score feedback
3. Use action verbs and quantifiable achievements (e.g., "Increased sales by 25%", "Managed team of 10 people")
4. Maintain professional tone and ATS-friendly formatting
5. Keep the same length or slightly shorter
6. Ensure the CV addresses ALL areas mentioned in the feedback

SCORING IMPROVEMENT STRATEGIES:
- If feedback mentions "professionalism": Use more formal language, remove casual phrases
- If feedback mentions "experience": Add specific achievements, metrics, and responsibilities
- If feedback mentions "keywords": Include industry-specific terms and professional vocabulary
- If feedback mentions "structure": Ensure proper sections (Contact, Experience, Education, Skills)
- If feedback mentions "relevance": Tailor content to the target role/industry

IMPORTANT: You must respond in this EXACT format:

REWRITTEN CV:
[The complete rewritten CV with all improvements applied]

CHANGES MADE:
[Bullet-point list of specific changes made to improve the CV]

IMPROVEMENT SUMMARY:
[2-3 sentences summarizing the key improvements and their impact]

Do not include any other text outside of the specified format.`;

    const userPrompt = `Original CV:
${cvText}

CV Score Feedback:
${scoreFeedback}

${targetRole ? `Target Role: ${targetRole}` : ''}

Please rewrite this CV based on the feedback provided. Focus on the specific areas mentioned in the feedback to ensure the rewritten CV scores higher than the original.`;

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
      improvementSummary: ''
    };

    if (rewriteResult.includes('REWRITTEN CV:')) {
      const cvMatch = rewriteResult.match(/REWRITTEN CV:\s*([\s\S]*?)(?=CHANGES MADE:|$)/);
      if (cvMatch) sections.rewrittenCV = cvMatch[1].trim();
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

// src/app/api/score/route.ts

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

    const { cvText, guest } = await req.json();

    if (!cvText || typeof cvText !== 'string') {
      return NextResponse.json({ error: 'Invalid CV text.' }, { status: 400 });
    }

    const systemPrompt = guest
      ? `You are an AI CV scoring assistant. Reply in this structure:

Overall Score (0–100): [score]

Feedback:
[1–2 sentences of general feedback and areas to improve.]

Do not include any introduction or closing remarks. Keep it concise and do not break from this format.`
      : `You are an AI CV scoring assistant. Always reply in the following structure:

Overall Score (0–100): [score]

1. Professionalism:
[1–2 sentence explanation, and score out of 25]

2. Experience:
[1–2 sentence explanation, and score out of 25]

3. Keyword Screening:
[1–2 sentence explanation, and score out of 25]

4. Relevance to Target Role:
[1–2 sentence explanation, and score out of 25]

5. Areas to improve:
[1–2 sentence explanation]

Do not include any introduction or closing remarks. Evaluate the overall score based on criteria 1 - 4, with the overall score being the sum of the scores of the criteria. Do not break from this format.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Here is the CV:\n\n${cvText}`,
        },
      ],
    });

    const score = response.choices[0].message?.content || '';
    return NextResponse.json({ score });
  } catch (err) {
    console.error('OpenAI API Error:', err);
    return NextResponse.json({ error: 'Failed to generate score' }, { status: 500 });
  }
}

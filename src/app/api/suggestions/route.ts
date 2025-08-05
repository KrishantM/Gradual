import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { auth, db } from '../../../../lib/firebase-admin';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

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
      const decodedToken = await auth.verifyIdToken(token);
      // You can access user info here: decodedToken.uid, decodedToken.email, etc.
    } catch (error) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    const { degree, gpa, interests, uid } = await req.json();

    // Validate required fields
    if (!degree || !gpa || !interests) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const prompt = `You are a career advisor AI. Based on the following user profile, provide 5 specific, actionable career-building suggestions. Each suggestion should be structured as:

[One line title:]
[1–2 sentence description with specific actions or recommendations]

Degree: ${degree}
GPA: ${gpa}
Interests: ${interests}

Respond only with the formatted list. Remove formatting such as asterisks or bullet points.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a helpful and specific career suggestion assistant.' },
        { role: 'user', content: prompt },
      ],
    });

    const suggestionsText = response.choices[0].message?.content || '';
    const suggestions = suggestionsText.split(/\n{2,}/).filter(line => line.trim() !== '');

    // ✅ Save to Firestore if UID is provided
    if (uid) {
      const ref = db.collection('suggestions').doc(uid);
      await ref.set({
        suggestions: suggestions.join('\n\n'),
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error('OpenAI Suggestion Error:', err);
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 });
  }
} 
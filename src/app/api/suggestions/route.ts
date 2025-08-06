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

    const { degree, gpa, gpaScale, interests, uid } = await req.json();

    // Validate required fields
    if (!degree || !gpa || !interests) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Calculate normalized GPA percentage for better context
    const calculateGPAPercentage = (gpaValue: number, scale: string) => {
      if (scale === '100') return Math.round(gpaValue);
      const maxScale = parseFloat(scale) || 4.0;
      const percentage = (gpaValue / maxScale) * 100;
      return Math.round(Math.min(percentage, 100));
    };

    const gpaPercentage = calculateGPAPercentage(parseFloat(gpa), gpaScale || '4.0');
    const gpaContext = gpaScale ? `${gpa} out of ${gpaScale} (${gpaPercentage}% performance level)` : gpa;

    const prompt = `You are a career advisor AI. Based on the following user profile, provide 5 specific, actionable career-building suggestions. Each suggestion should be structured as:

[One line title:]
[1–2 sentence description with specific actions or recommendations]

Degree: ${degree}
GPA: ${gpaContext}
Interests: ${interests}

Consider the student's academic performance level when providing suggestions. Higher performers might be directed toward competitive programs/roles, while all students should receive valuable, achievable advice.

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
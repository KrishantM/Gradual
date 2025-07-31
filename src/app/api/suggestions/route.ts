import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  const { degree, gpa, interests, uid } = await req.json();

  try {
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
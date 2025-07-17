import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

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
      const ref = doc(db, 'suggestions', uid);
      await setDoc(ref, {
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
import { NextRequest, NextResponse } from 'next/server';
import MailerLite from '@mailerlite/mailerlite-nodejs';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const mailerlite = new MailerLite({
  api_key: process.env.MAILERLITE_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { name, email } = await request.json();
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check for duplicate in Firestore
    const q = query(collection(db, "waitlist"), where("email", "==", normalizedEmail));
    const existing = await getDocs(q);

    if (!existing.empty) {
      return NextResponse.json(
        { error: "You're already on the waitlist. We'll be in touch soon!" },
        { status: 400 }
      );
    }

    // 2. Save to Firestore
    await addDoc(collection(db, "waitlist"), {
      name,
      email: normalizedEmail,
      submittedAt: serverTimestamp(),
    });

    // 3. Add to MailerLite audience
    try {
      await mailerlite.subscribers.createOrUpdate({
        email: normalizedEmail,
        fields: {
          name: name,
        },
        groups: ['161492505912673451'], // Waitlisted Users group
        status: 'active',
      });
    } catch (mailerliteError) {
      console.error('MailerLite error:', mailerliteError);
      // Don't fail the entire request if MailerLite fails
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error during waitlist submission:', error);
    return NextResponse.json(
      { error: "Oops! Something went wrong. Please try again." },
      { status: 500 }
    );
  }
} 
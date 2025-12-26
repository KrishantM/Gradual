import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, track, message } = body;

    // Validate required fields
    if (!name || !email || !track || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Save to Firestore
    const leadData = {
      name: name.trim(),
      email: normalizedEmail,
      track,
      message: message.trim(),
      submittedAt: new Date().toISOString(),
      status: 'new',
      source: 'consulting-contact-form',
    };

    // Save to consultingLeads collection in Firestore
    const docRef = await db.collection('consultingLeads').add(leadData);

    // TODO: Optional - Send email notification
    // You can integrate with an email service here (e.g., SendGrid, Resend, Nodemailer)
    // Example:
    // await sendEmailNotification({
    //   to: process.env.CONSULTING_EMAIL || 'consulting@gradual.com',
    //   subject: `New Consulting Lead: ${name}`,
    //   body: `Name: ${name}\nEmail: ${email}\nTrack: ${track}\nMessage: ${message}`
    // });

    console.log('Consulting lead saved to Firestore:', docRef.id);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Form submitted successfully',
        id: docRef.id
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing consulting lead:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

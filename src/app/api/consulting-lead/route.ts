import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase-admin';
import { Resend } from 'resend';

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

    // Send email notification
    try {
      // Only send email if API key is configured
      if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY not configured. Email notification skipped. Form data saved to Firestore.');
      } else {
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        const trackLabels: Record<string, string> = {
          'high-school': 'High School & Pre-University Pathways',
          'university': 'University & Early Career',
          'not-sure': 'Not sure yet',
        };

        const trackLabel = trackLabels[track] || track;

        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
        
        await resend.emails.send({
        from: `Gradual Consulting <${fromEmail}>`,
        to: 'admin@gradual.co.nz',
        replyTo: normalizedEmail,
        subject: `New Consulting Inquiry: ${name}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #1e293b 0%, #1e40af 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
                <h1 style="color: #fff; margin: 0; font-size: 24px;">New Consulting Inquiry</h1>
              </div>
              <div style="background: #fff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
                <p style="margin-top: 0; font-size: 16px;">You have received a new message from the Gradual Consulting contact form:</p>
                
                <div style="background: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0;">
                  <p style="margin: 0 0 10px 0;"><strong style="color: #1e293b;">Name:</strong> ${name.trim()}</p>
                  <p style="margin: 0 0 10px 0;"><strong style="color: #1e293b;">Email:</strong> <a href="mailto:${normalizedEmail}" style="color: #2563eb; text-decoration: none;">${normalizedEmail}</a></p>
                  <p style="margin: 0 0 10px 0;"><strong style="color: #1e293b;">Track:</strong> ${trackLabel}</p>
                </div>
                
                <div style="margin: 20px 0;">
                  <h3 style="color: #1e293b; margin-bottom: 10px; font-size: 18px;">Message:</h3>
                  <div style="background: #fff; padding: 15px; border-left: 3px solid #2563eb; border-radius: 4px; white-space: pre-wrap; color: #475569;">${message.trim()}</div>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; font-size: 14px; color: #64748b;">
                    This message was sent from the Gradual Consulting contact form. You can reply directly to this email to respond to ${name.trim()}.
                  </p>
                </div>
              </div>
            </body>
          </html>
        `,
        });

        console.log('Email notification sent successfully');
      }
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
      // Don't fail the request if email fails - the form data is already saved to Firestore
    }

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

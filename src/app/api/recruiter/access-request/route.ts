/**
 * POST /api/recruiter/access-request
 *
 * In-app "Request recruiter access" form. Stores the lead in Firestore
 * (`recruiterAccessRequests`) and emails admin@gradual.co.nz via Resend.
 *
 * Authenticated callers get their uid attached so we can correlate the
 * request to an existing user account. Unauthenticated submissions are
 * still accepted — the form lives inside the paywall, which is reachable
 * only after sign-in today, but we don't enforce that at the API layer.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { auth, db } from '../../../../../lib/firebase-admin';

interface AccessRequestBody {
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string;
  organisation?: string;
  message?: string;
}

const MAX_MESSAGE = 2000;
const MAX_FIELD = 200;

function sanitize(value: unknown, max = MAX_FIELD): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(req: NextRequest) {
  let body: AccessRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const fullName = sanitize(body.fullName);
  const email = sanitize(body.email).toLowerCase();
  const phone = sanitize(body.phone, 50);
  const role = sanitize(body.role);
  const organisation = sanitize(body.organisation);
  const message = sanitize(body.message, MAX_MESSAGE);

  if (!fullName || !email || !phone || !role || !organisation) {
    return NextResponse.json(
      { error: 'Name, email, phone, role and organisation are required' },
      { status: 400 }
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please provide a valid email address' }, { status: 400 });
  }

  // Best-effort attach uid if the caller is signed in. Failure is fine.
  let viewerUid: string | null = null;
  let viewerEmail: string | null = null;
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token) {
    try {
      const decoded = await auth.verifyIdToken(token);
      viewerUid = decoded.uid;
      viewerEmail = decoded.email ?? null;
    } catch {
      // ignored — anonymous submissions allowed
    }
  }

  const record = {
    fullName,
    email,
    phone,
    role,
    organisation,
    message,
    viewerUid,
    viewerEmail,
    status: 'new' as const,
    source: 'recruiter-paywall',
    createdAt: new Date().toISOString(),
  };

  let docId: string;
  try {
    const docRef = await db.collection('recruiterAccessRequests').add(record);
    docId = docRef.id;
  } catch (e) {
    console.error('[recruiter access-request] firestore write failed', e);
    return NextResponse.json({ error: 'Could not submit request' }, { status: 500 });
  }

  // Email is best-effort — never fail the request if Resend is down/missing.
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

      await resend.emails.send({
        from: `Gradual Recruiter <${fromEmail}>`,
        to: 'admin@gradual.co.nz',
        replyTo: email,
        subject: `Recruiter access request — ${organisation}`,
        html: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 640px; margin: 0 auto; padding: 24px;">
              <div style="background: linear-gradient(135deg, #1e293b 0%, #2563eb 100%); padding: 28px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: #fff; margin: 0; font-size: 22px;">New recruiter access request</h1>
              </div>
              <div style="background: #fff; padding: 28px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
                <p style="margin: 0 0 20px 0; font-size: 15px; color: #475569;">
                  A new recruiter has requested access via the Gradual paywall:
                </p>
                <div style="background: #f8fafc; padding: 18px 20px; border-radius: 8px; margin-bottom: 20px;">
                  <p style="margin: 0 0 8px 0;"><strong>Name:</strong> ${escapeHtml(fullName)}</p>
                  <p style="margin: 0 0 8px 0;"><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}" style="color: #2563eb;">${escapeHtml(email)}</a></p>
                  ${phone ? `<p style="margin: 0 0 8px 0;"><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ''}
                  <p style="margin: 0 0 8px 0;"><strong>Role:</strong> ${escapeHtml(role)}</p>
                  <p style="margin: 0 0 8px 0;"><strong>Organisation:</strong> ${escapeHtml(organisation)}</p>
                  ${viewerEmail ? `<p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px;">Signed in as: ${escapeHtml(viewerEmail)}</p>` : ''}
                </div>
                <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #1e293b;">Message</h3>
                <div style="background: #fff; padding: 14px 16px; border-left: 3px solid #2563eb; border-radius: 4px; white-space: pre-wrap; color: #475569;">${escapeHtml(message)}</div>
                <p style="margin: 24px 0 0 0; font-size: 12px; color: #94a3b8;">
                  Reply directly to this email to respond. Submission ID: ${docId}
                </p>
              </div>
            </body>
          </html>
        `,
      });
    } catch (emailError) {
      console.error('[recruiter access-request] email failed', emailError);
    }
  } else {
    console.warn('[recruiter access-request] RESEND_API_KEY missing — request stored only');
  }

  return NextResponse.json({ id: docId, status: 'received' });
}

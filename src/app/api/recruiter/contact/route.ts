/**
 * POST /api/recruiter/contact
 *
 * Records a contact request from a recruiter to a candidate. Important: the
 * recruiter never receives the candidate's email — the contact is stored
 * pending and would be relayed via Gradual after candidate consent (out of
 * scope for the demo).
 */

import { NextRequest, NextResponse } from 'next/server';
import { resolveRecruiterAccessFromToken } from '@/lib/recruiter/access';
import { db } from '../../../../../lib/firebase-admin';

const MAX_MESSAGE_LEN = 1000;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const { uid, email, access } = await resolveRecruiterAccessFromToken(token);

  if (!access.hasAccess || !uid) {
    return NextResponse.json(
      { error: 'Recruiter access required', reason: access.reason },
      { status: 403 }
    );
  }

  let body: { studentId?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const studentId = typeof body.studentId === 'string' ? body.studentId : '';
  const message = (typeof body.message === 'string' ? body.message : '')
    .trim()
    .slice(0, MAX_MESSAGE_LEN);

  if (!studentId || !message) {
    return NextResponse.json({ error: 'studentId and message required' }, { status: 400 });
  }

  try {
    const studentSnap = await db.collection('users').doc(studentId).get();
    if (!studentSnap.exists) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }
    const studentData = studentSnap.data() ?? {};
    if (studentData.allowRecruiterContact === false) {
      return NextResponse.json(
        { error: 'Candidate is not accepting recruiter contact' },
        { status: 403 }
      );
    }

    // Store the message — do NOT include the candidate's contact details in
    // the response. Relay flow happens out-of-band.
    const docRef = await db.collection('recruiterContacts').add({
      recruiterId: uid,
      recruiterEmail: email ?? null,
      studentId,
      message,
      status: 'pending',
      createdAt: new Date(),
    });

    return NextResponse.json({ id: docRef.id, status: 'pending' });
  } catch (e) {
    console.error('[POST /api/recruiter/contact]', e);
    return NextResponse.json({ error: 'Could not send contact request' }, { status: 500 });
  }
}

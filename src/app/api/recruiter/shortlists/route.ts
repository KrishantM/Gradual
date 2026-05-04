import { NextRequest, NextResponse } from 'next/server';
import { resolveRecruiterAccessFromToken } from '@/lib/recruiter/access';
import { db } from '../../../../../lib/firebase-admin';

const MAX_SHORTLIST_SIZE = 50;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const { uid, access } = await resolveRecruiterAccessFromToken(token);

  if (!access.hasAccess || !uid) {
    return NextResponse.json(
      { error: 'Recruiter access required', reason: access.reason },
      { status: 403 }
    );
  }

  try {
    const snap = await db
      .collection('recruiterShortlists')
      .where('recruiterId', '==', uid)
      .get();

    const shortlists = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        name: typeof d.name === 'string' ? d.name : '',
        candidateCount: Array.isArray(d.studentIds) ? d.studentIds.length : 0,
        createdAt:
          d.createdAt instanceof Date
            ? d.createdAt.toISOString()
            : typeof d.createdAt === 'string'
            ? d.createdAt
            : null,
      };
    });
    return NextResponse.json({ shortlists });
  } catch (e) {
    console.error('[GET /api/recruiter/shortlists]', e);
    return NextResponse.json({ shortlists: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const { uid, access } = await resolveRecruiterAccessFromToken(token);

  if (!access.hasAccess || !uid) {
    return NextResponse.json(
      { error: 'Recruiter access required', reason: access.reason },
      { status: 403 }
    );
  }

  let body: { name?: string; studentIds?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const studentIds = Array.isArray(body.studentIds)
    ? body.studentIds.filter((s): s is string => typeof s === 'string').slice(0, MAX_SHORTLIST_SIZE)
    : [];

  if (!name || studentIds.length === 0) {
    return NextResponse.json({ error: 'Name and at least one candidate required' }, { status: 400 });
  }

  try {
    const docRef = await db.collection('recruiterShortlists').add({
      recruiterId: uid,
      name,
      studentIds,
      createdAt: new Date(),
      updatedAt: new Date(),
      isShared: false,
    });
    return NextResponse.json({ id: docRef.id, name, candidateCount: studentIds.length });
  } catch (e) {
    console.error('[POST /api/recruiter/shortlists]', e);
    return NextResponse.json({ error: 'Could not create shortlist' }, { status: 500 });
  }
}

/**
 * GET /api/planner/events?from=YYYY-MM-DD&to=YYYY-MM-DD
 * POST /api/planner/events body: { date: string, title: string, notes?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth, db } from '@/lib/firebase-admin';

const PostBodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().min(1).max(500).transform((s) => s.trim()),
  notes: z.string().max(2000).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await auth.verifyIdToken(authHeader.slice(7));
    const uid = decoded.uid;

    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    if (!from || !to || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      return NextResponse.json({ error: 'Query params from and to (YYYY-MM-DD) required' }, { status: 400 });
    }

    const snap = await db
      .collection('users')
      .doc(uid)
      .collection('planner_events')
      .where('date', '>=', from)
      .where('date', '<=', to)
      .orderBy('date')
      .get();

    const events = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        date: d.date,
        title: d.title,
        notes: d.notes,
        source: d.source,
        createdAt: (d.createdAt as { toDate?: () => Date })?.toDate?.()?.toISOString() ?? null,
      };
    });

    return NextResponse.json({ events });
  } catch (e) {
    console.error('[GET /api/planner/events]', e);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await auth.verifyIdToken(authHeader.slice(7));
    const uid = decoded.uid;

    const raw = await req.json();
    const parseResult = PostBodySchema.safeParse(raw);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid body', details: parseResult.error.flatten() }, { status: 400 });
    }
    const { date, title, notes } = parseResult.data;

    const ref = await db.collection('users').doc(uid).collection('planner_events').add({
      date,
      title,
      notes: notes ?? '',
      source: 'user',
      createdAt: new Date(),
    });

    return NextResponse.json({ id: ref.id, date, title, notes });
  } catch (e) {
    console.error('[POST /api/planner/events]', e);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}

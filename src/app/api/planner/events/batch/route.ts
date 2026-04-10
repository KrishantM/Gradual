import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth, db } from '@/lib/firebase-admin';

const BatchSchema = z.object({
  events: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      title: z.string().min(1).max(500).transform((s) => s.trim()),
      notes: z.string().max(2000).optional(),
      source: z.enum(['user', 'copilot', 'system']).optional().default('copilot'),
    })
  ).min(1).max(20),
});

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await auth.verifyIdToken(authHeader.slice(7));
    const uid = decoded.uid;

    const raw = await req.json();
    const parseResult = BatchSchema.safeParse(raw);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid body', details: parseResult.error.flatten() }, { status: 400 });
    }

    const eventsRef = db.collection('users').doc(uid).collection('planner_events');
    const batch = db.batch();
    const ids: string[] = [];

    for (const evt of parseResult.data.events) {
      const ref = eventsRef.doc();
      batch.set(ref, {
        date: evt.date,
        title: evt.title,
        notes: evt.notes ?? '',
        source: evt.source,
        createdAt: new Date(),
      });
      ids.push(ref.id);
    }

    await batch.commit();

    return NextResponse.json({ created: ids.length, ids });
  } catch (e) {
    console.error('[POST /api/planner/events/batch]', e);
    return NextResponse.json({ error: 'Failed to create events' }, { status: 500 });
  }
}

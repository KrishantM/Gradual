/**
 * DELETE /api/planner/events/[id]
 * PATCH  /api/planner/events/[id]  — update title, notes, startTime, endTime
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth, db } from '@/lib/firebase-admin';

const PatchBodySchema = z.object({
  title: z.string().min(1).max(500).transform((s) => s.trim()).optional(),
  notes: z.string().max(2000).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await auth.verifyIdToken(authHeader.slice(7));
    const uid = decoded.uid;
    const { id } = await params;

    const raw = await req.json();
    const parseResult = PatchBodySchema.safeParse(raw);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid body', details: parseResult.error.flatten() }, { status: 400 });
    }

    const ref = db.collection('users').doc(uid).collection('planner_events').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    const data = parseResult.data;
    if (data.title !== undefined) updates.title = data.title;
    if (data.notes !== undefined) updates.notes = data.notes;
    if (data.startTime !== undefined) updates.startTime = data.startTime ?? null;
    if (data.endTime !== undefined) updates.endTime = data.endTime ?? null;

    await ref.update(updates);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[PATCH /api/planner/events/[id]]', e);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = _req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await auth.verifyIdToken(authHeader.slice(7));
    const uid = decoded.uid;
    const { id } = await params;

    const ref = db.collection('users').doc(uid).collection('planner_events').doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if ((snap.data() as { userId?: string })?.userId && (snap.data() as { userId?: string }).userId !== uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await ref.delete();
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[DELETE /api/planner/events]', e);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}

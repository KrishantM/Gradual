/**
 * DELETE /api/planner/events/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';

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

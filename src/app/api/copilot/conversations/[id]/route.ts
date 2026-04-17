/**
 * GET /api/copilot/conversations/[id]  — load one conversation
 * DELETE /api/copilot/conversations/[id] — delete one conversation
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = _req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await auth.verifyIdToken(token);
    const uid = decoded.uid;

    const snap = await db
      .collection('users')
      .doc(uid)
      .collection('copilot_conversations')
      .doc(id)
      .get();

    if (!snap.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const d = snap.data()!;
    const createdAt = (d.createdAt as { toDate?: () => Date })?.toDate?.();

    return NextResponse.json({
      id: snap.id,
      messages: (d.messages as { role: string; content: string }[]) ?? [],
      title: d.title ?? 'Conversation',
      createdAt: createdAt?.toISOString() ?? null,
    });
  } catch (e) {
    console.error('[GET /api/copilot/conversations/[id]]', e);
    return NextResponse.json({ error: 'Failed to load conversation' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = _req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await auth.verifyIdToken(token);
    const uid = decoded.uid;

    await db
      .collection('users')
      .doc(uid)
      .collection('copilot_conversations')
      .doc(id)
      .delete();

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[DELETE /api/copilot/conversations/[id]]', e);
    return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
  }
}

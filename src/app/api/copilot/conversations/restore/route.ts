/**
 * POST /api/copilot/conversations/restore
 * Body: { id: string }. Loads that archived conversation into current.
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth, db } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const h = await headers();
    const authHeader = h.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await auth.verifyIdToken(token);
    const uid = decoded.uid;

    const body = await req.json();
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const snap = await db
      .collection('users')
      .doc(uid)
      .collection('copilot_conversations')
      .doc(id)
      .get();

    if (!snap.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const messages = (snap.data()?.messages as { role: string; content: string }[]) ?? [];

    await db.collection('users').doc(uid).collection('copilot_state').doc('current').set({
      messages,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true, messageCount: messages.length });
  } catch (e) {
    console.error('[POST /api/copilot/conversations/restore]', e);
    return NextResponse.json({ error: 'Failed to restore' }, { status: 500 });
  }
}

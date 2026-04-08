/**
 * GET /api/copilot/current — returns current conversation messages for the thread UI.
 * DELETE /api/copilot/current — clears the conversation.
 */

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth, db } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const h = await headers();
    const authHeader = h.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await auth.verifyIdToken(token);
    const uid = decoded.uid;

    const snap = await db.collection('users').doc(uid).collection('copilot_state').doc('current').get();
    const messages = (snap.exists ? (snap.data()?.messages as { role: string; content: string }[]) : null) ?? [];

    return NextResponse.json({ messages });
  } catch (e) {
    console.error('[GET /api/copilot/current]', e);
    return NextResponse.json({ error: 'Failed to load conversation' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const h = await headers();
    const authHeader = h.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await auth.verifyIdToken(token);
    const uid = decoded.uid;

    await db.collection('users').doc(uid).collection('copilot_state').doc('current').set({
      messages: [],
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[DELETE /api/copilot/current]', e);
    return NextResponse.json({ error: 'Failed to clear conversation' }, { status: 500 });
  }
}

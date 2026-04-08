/**
 * POST /api/copilot/conversations/archive
 * Saves the current conversation to the archive and clears current.
 */

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth, db } from '@/lib/firebase-admin';

function titleFromMessages(messages: { role: string; content: string }[]): string {
  const firstUser = messages.find((m) => m.role === 'user');
  const text = firstUser?.content?.trim() ?? '';
  if (!text) return 'Conversation';
  return text.length > 50 ? text.slice(0, 47) + '…' : text;
}

export async function POST() {
  try {
    const h = await headers();
    const authHeader = h.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await auth.verifyIdToken(token);
    const uid = decoded.uid;

    const currentSnap = await db.collection('users').doc(uid).collection('copilot_state').doc('current').get();
    const messages = (currentSnap.exists ? (currentSnap.data()?.messages as { role: string; content: string }[]) : null) ?? [];

    if (messages.length === 0) {
      return NextResponse.json({ id: null, archived: false });
    }

    const title = titleFromMessages(messages);
    const ref = await db.collection('users').doc(uid).collection('copilot_conversations').add({
      messages,
      title,
      createdAt: new Date(),
    });

    await db.collection('users').doc(uid).collection('copilot_state').doc('current').set({
      messages: [],
      updatedAt: new Date(),
    });

    return NextResponse.json({
      id: ref.id,
      archived: true,
      title,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[POST /api/copilot/conversations/archive]', e);
    return NextResponse.json({ error: 'Failed to archive' }, { status: 500 });
  }
}

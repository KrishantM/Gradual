/**
 * GET /api/copilot/conversations
 * Lists archived conversations (id, title, createdAt), newest first.
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

    const snap = await db
      .collection('users')
      .doc(uid)
      .collection('copilot_conversations')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const conversations = snap.docs.map((doc) => {
      const d = doc.data();
      const createdAt = (d.createdAt as { toDate?: () => Date })?.toDate?.();
      return {
        id: doc.id,
        title: d.title ?? 'Conversation',
        createdAt: createdAt?.toISOString() ?? null,
      };
    });

    return NextResponse.json({ conversations });
  } catch (e) {
    console.error('[GET /api/copilot/conversations]', e);
    return NextResponse.json({ error: 'Failed to list conversations' }, { status: 500 });
  }
}

/**
 * POST /api/copilot/undo
 * Undo auto-created todos from assist mode using the undo token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth, db } from '@/lib/firebase-admin';

const BodySchema = z.object({
  undoToken: z.string().uuid(),
});

const UNDO_TTL_MS = 5 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await auth.verifyIdToken(token);
    const uid = decoded.uid;

    const raw = await req.json();
    const parseResult = BodySchema.safeParse(raw);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }
    const { undoToken } = parseResult.data;

    const undoRef = db.collection('users').doc(uid).collection('copilot_undo').doc(undoToken);
    const undoSnap = await undoRef.get();
    if (!undoSnap.exists) {
      return NextResponse.json({ error: 'Invalid or expired undo token' }, { status: 404 });
    }
    const data = undoSnap.data();
    const createdAt = (data?.createdAt as { toDate?: () => Date })?.toDate?.();
    if (createdAt && Date.now() - createdAt.getTime() > UNDO_TTL_MS) {
      await undoRef.delete();
      return NextResponse.json({ error: 'Undo window expired' }, { status: 410 });
    }

    const todoIds = (data?.todoIds as string[]) ?? [];
    const collectionName = (data?.collection as string) === 'todos' ? 'todos' : 'actionItems';
    const batch = db.batch();
    for (const id of todoIds) {
      const ref = db.collection(collectionName).doc(id);
      const snap = await ref.get();
      if (snap.exists && (snap.data()?.userId === uid)) {
        batch.delete(ref);
      }
    }
    await batch.commit();
    await undoRef.delete();

    return NextResponse.json({ success: true, deleted: todoIds.length });
  } catch (e) {
    console.error('[POST /api/copilot/undo]', e);
    return NextResponse.json({ error: 'Failed to undo' }, { status: 500 });
  }
}

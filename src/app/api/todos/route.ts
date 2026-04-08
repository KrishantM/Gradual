/**
 * POST /api/todos
 * Create a todo in the dashboard "Career To-do" list (todos collection).
 * Used by Copilot and any client that wants server-side todo creation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth, db } from '@/lib/firebase-admin';

const BodySchema = z.object({
  text: z.string().min(1).max(2000).transform((s) => s.trim()),
});

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
      return NextResponse.json({ error: 'Invalid body', details: parseResult.error.flatten() }, { status: 400 });
    }
    const { text } = parseResult.data;

    const ref = await db.collection('todos').add({
      userId: uid,
      text,
      timestamp: new Date(),
    });

    return NextResponse.json({ id: ref.id, text });
  } catch (e) {
    console.error('[POST /api/todos]', e);
    return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 });
  }
}

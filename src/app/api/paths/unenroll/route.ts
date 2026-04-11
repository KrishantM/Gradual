/**
 * POST /api/paths/unenroll
 * Body: { pathId: string }
 *
 * Deletes the user's path_state document for this path. Does not touch any
 * planner_events that were already created — those remain on the user's
 * planner so progress isn't silently undone.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth, db } from '@/lib/firebase-admin';

const BodySchema = z.object({ pathId: z.string().min(1).max(120) });

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await auth.verifyIdToken(authHeader.slice(7));
    const uid = decoded.uid;

    const raw = await req.json();
    const parseResult = BodySchema.safeParse(raw);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid body', details: parseResult.error.flatten() }, { status: 400 });
    }
    const { pathId } = parseResult.data;

    await db.collection('users').doc(uid).collection('path_state').doc(pathId).delete();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[POST /api/paths/unenroll]', e);
    return NextResponse.json({ error: 'Failed to unenroll' }, { status: 500 });
  }
}

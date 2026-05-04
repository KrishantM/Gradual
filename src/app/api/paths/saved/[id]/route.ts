/**
 * DELETE /api/paths/saved/[id]  → remove a saved generated pathway
 * PATCH  /api/paths/saved/[id]  → bump lastViewedAt timestamp
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';

async function authenticate(req: NextRequest): Promise<string | NextResponse> {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await auth.verifyIdToken(authHeader.slice(7));
    return decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const uidOrError = await authenticate(req);
  if (typeof uidOrError !== 'string') return uidOrError;
  const uid = uidOrError;

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  try {
    await db.collection('users').doc(uid).collection('generated_pathways').doc(id).delete();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[DELETE /api/paths/saved/:id]', e);
    return NextResponse.json({ error: 'Failed to delete pathway' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const uidOrError = await authenticate(req);
  if (typeof uidOrError !== 'string') return uidOrError;
  const uid = uidOrError;

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  try {
    await db
      .collection('users')
      .doc(uid)
      .collection('generated_pathways')
      .doc(id)
      .set({ lastViewedAt: new Date() }, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[PATCH /api/paths/saved/:id]', e);
    return NextResponse.json({ error: 'Failed to update pathway' }, { status: 500 });
  }
}

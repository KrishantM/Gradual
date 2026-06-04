/**
 * GET  /api/copilot/settings — current G.ai autonomy level + today's usage.
 * PATCH /api/copilot/settings — update the autonomy level.
 *
 * Autonomy is stored on users/{uid}.gaiAutonomy and read by the chat endpoint
 * to decide whether G.ai acts autonomously, proposes actions, or only suggests.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth, db } from '@/lib/firebase-admin';
import { normalizeAutonomy } from '@/lib/copilot/autonomy';
import { peekDailyUsage } from '@/lib/copilot/rate-limit';

const PatchSchema = z.object({
  autonomy: z.enum(['full_auto', 'confirm', 'manual']),
});

async function requireUid(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const decoded = await auth.verifyIdToken(authHeader.slice(7));
    return decoded.uid;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const uid = await requireUid(req);
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const snap = await db.collection('users').doc(uid).get();
    const autonomy = normalizeAutonomy(snap.exists ? snap.data()?.gaiAutonomy : undefined);
    const usage = await peekDailyUsage(uid);

    return NextResponse.json({ autonomy, usage });
  } catch (e) {
    console.error('[GET /api/copilot/settings]', e);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const uid = await requireUid(req);
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parsed = PatchSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    await db
      .collection('users')
      .doc(uid)
      .set({ gaiAutonomy: parsed.data.autonomy }, { merge: true });

    return NextResponse.json({ autonomy: parsed.data.autonomy });
  } catch (e) {
    console.error('[PATCH /api/copilot/settings]', e);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

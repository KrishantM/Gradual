/**
 * GET /api/copilot/latest
 * Returns the most recent cached Copilot output for the authenticated user.
 */

import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await auth.verifyIdToken(token);
    const uid = decoded.uid;

    const snap = await db.collection('users').doc(uid).collection('copilot_state').doc('latest').get();
    if (!snap.exists) {
      return NextResponse.json(null);
    }
    const data = snap.data();
    const createdAt = (data?.createdAt as { toDate?: () => Date })?.toDate?.();
    return NextResponse.json({
      answer: data?.answer ?? '',
      priorities: data?.priorities ?? [],
      suggestedTodos: data?.suggestedTodos ?? [],
      suggestedOpportunities: data?.suggestedOpportunities ?? [],
      consultingRecommendation: data?.consultingRecommendation ?? undefined,
      weeklyPlan: data?.weeklyPlan ?? undefined,
      userMessage: data?.userMessage ?? '',
      createdAt: createdAt?.toISOString() ?? null,
    });
  } catch (e) {
    console.error('[GET /api/copilot/latest]', e);
    return NextResponse.json({ error: 'Failed to load latest' }, { status: 500 });
  }
}

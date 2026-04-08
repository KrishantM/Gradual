/**
 * GET /api/copilot/context
 * Returns unified Career Context for the authenticated user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { getCareerContext } from '@/lib/copilot/get-career-context';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await auth.verifyIdToken(token);
    const uid = decoded.uid;

    const context = await getCareerContext(uid);
    return NextResponse.json(context);
  } catch (e) {
    console.error('[GET /api/copilot/context]', e);
    return NextResponse.json({ error: 'Failed to load context' }, { status: 500 });
  }
}

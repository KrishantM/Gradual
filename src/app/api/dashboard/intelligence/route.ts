import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';
import { getCareerContext } from '@/lib/copilot/get-career-context';
import { evaluateSignals } from '@/lib/copilot/evaluate-signals';
import { calculateProfileCompletion } from '@/lib/profile-completion';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await auth.verifyIdToken(authHeader.slice(7));
    const uid = decoded.uid;

    // Fetch career context (profile, CV, applications, todos, opportunities)
    const context = await getCareerContext(uid);

    // Compute signals
    const signals = evaluateSignals(context);

    // Profile completion
    const profileCompletion = calculateProfileCompletion(
      (context.profile as Record<string, unknown>) ?? {}
    );

    // CV score
    const cvScore = context.cv?.score ?? null;

    // Latest copilot state
    let latestCopilot: {
      weeklyPlan: Record<string, { title: string; notes?: string }[]> | null;
      priorities: { title: string; rationale: string }[];
      createdAt: string | null;
    } | null = null;

    try {
      const latestSnap = await db
        .collection('users')
        .doc(uid)
        .collection('copilot_state')
        .doc('latest')
        .get();

      if (latestSnap.exists) {
        const data = latestSnap.data() || {};
        latestCopilot = {
          weeklyPlan: data.weeklyPlan ?? null,
          priorities: data.priorities ?? [],
          createdAt: data.createdAt ?? null,
        };
      }
    } catch {
      // Non-fatal
    }

    // Today's planner events
    const today = new Date().toISOString().slice(0, 10);
    const todayEventsSnap = await db
      .collection('users')
      .doc(uid)
      .collection('planner_events')
      .where('date', '==', today)
      .get();

    const todayPlannerEvents = todayEventsSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        date: d.date,
        title: d.title,
        notes: d.notes,
        source: d.source ?? 'user',
      };
    });

    // Opportunity momentum
    const savedCount = context.opportunities?.saved?.length ?? 0;
    const recentApplications = context.applications?.recent?.length ?? 0;

    return NextResponse.json({
      signals,
      profileCompletion,
      cvScore,
      latestCopilot,
      todayPlannerEvents,
      opportunityMomentum: {
        savedCount,
        recentApplications,
      },
    });
  } catch (e) {
    console.error('[GET /api/dashboard/intelligence]', e);
    return NextResponse.json({ error: 'Failed to compute intelligence' }, { status: 500 });
  }
}

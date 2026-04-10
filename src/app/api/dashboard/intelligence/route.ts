import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';
import { getCareerContext } from '@/lib/copilot/get-career-context';
import { evaluateSignals } from '@/lib/copilot/evaluate-signals';
import { calculateProfileCompletion } from '@/lib/profile-completion';

type Signals = ReturnType<typeof evaluateSignals> | null;

interface IntelligenceResponse {
  signals: Signals;
  profileCompletion: number;
  cvScore: number | null;
  latestCopilot: {
    weeklyPlan: Record<string, { title: string; notes?: string }[]> | null;
    priorities: { title: string; rationale: string }[];
    createdAt: string | null;
  } | null;
  todayPlannerEvents: Array<{
    id: string;
    date: string;
    title: string;
    notes?: string;
    source: string;
  }>;
  opportunityMomentum: {
    savedCount: number;
    recentApplications: number;
  };
  degraded: string[];
}

export async function GET(req: NextRequest) {
  // Auth is the only hard failure mode — without a UID we can't return anything useful.
  let uid: string;
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await auth.verifyIdToken(authHeader.slice(7));
    uid = decoded.uid;
  } catch (e) {
    console.error('[GET /api/dashboard/intelligence] auth failed', e);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Build response section by section. Any failure degrades that section only.
  const result: IntelligenceResponse = {
    signals: null,
    profileCompletion: 0,
    cvScore: null,
    latestCopilot: null,
    todayPlannerEvents: [],
    opportunityMomentum: { savedCount: 0, recentApplications: 0 },
    degraded: [],
  };

  // Career context (profile, CV, applications, todos, opportunities) — drives signals + momentum
  let context: Awaited<ReturnType<typeof getCareerContext>> | null = null;
  try {
    context = await getCareerContext(uid);
  } catch (e) {
    console.error('[GET /api/dashboard/intelligence] getCareerContext failed', e);
    result.degraded.push('careerContext');
  }

  if (context) {
    try {
      result.signals = evaluateSignals(context);
    } catch (e) {
      console.error('[GET /api/dashboard/intelligence] evaluateSignals failed', e);
      result.degraded.push('signals');
    }

    try {
      result.profileCompletion = calculateProfileCompletion(
        (context.profile as Record<string, unknown>) ?? {}
      );
    } catch (e) {
      console.error('[GET /api/dashboard/intelligence] profileCompletion failed', e);
      result.degraded.push('profileCompletion');
    }

    result.cvScore = context.cv?.score ?? null;
    result.opportunityMomentum = {
      savedCount: context.opportunities?.saved?.length ?? 0,
      recentApplications: context.applications?.recent?.length ?? 0,
    };
  }

  // Latest copilot state
  try {
    const latestSnap = await db
      .collection('users')
      .doc(uid)
      .collection('copilot_state')
      .doc('latest')
      .get();

    if (latestSnap.exists) {
      const data = latestSnap.data() || {};
      // createdAt is stored as a Firestore Timestamp via `new Date()`. The admin
      // SDK returns it as a Timestamp object, so we normalize to an ISO string here
      // (matches the planner-events endpoint pattern). Falls back to a string if
      // legacy data was already stored as a string.
      const rawCreated = data.createdAt;
      let createdAtIso: string | null = null;
      if (rawCreated) {
        if (typeof rawCreated === 'string') {
          createdAtIso = rawCreated;
        } else if (typeof (rawCreated as { toDate?: () => Date }).toDate === 'function') {
          createdAtIso = (rawCreated as { toDate: () => Date }).toDate().toISOString();
        } else if (rawCreated instanceof Date) {
          createdAtIso = rawCreated.toISOString();
        }
      }
      result.latestCopilot = {
        weeklyPlan: data.weeklyPlan ?? null,
        priorities: data.priorities ?? [],
        createdAt: createdAtIso,
      };
    }
  } catch (e) {
    console.error('[GET /api/dashboard/intelligence] latestCopilot failed', e);
    result.degraded.push('latestCopilot');
  }

  // Today's planner events. Client passes ?date=YYYY-MM-DD in their LOCAL
  // timezone — we trust it after a strict format check. Falls back to UTC date
  // only when the param is missing or malformed (e.g. legacy callers).
  try {
    const dateParam = new URL(req.url).searchParams.get('date');
    const today =
      dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
        ? dateParam
        : new Date().toISOString().slice(0, 10);
    const todayEventsSnap = await db
      .collection('users')
      .doc(uid)
      .collection('planner_events')
      .where('date', '==', today)
      .get();

    result.todayPlannerEvents = todayEventsSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        date: d.date,
        title: d.title,
        notes: d.notes,
        source: d.source ?? 'user',
      };
    });
  } catch (e) {
    console.error('[GET /api/dashboard/intelligence] todayPlannerEvents failed', e);
    result.degraded.push('todayPlannerEvents');
  }

  return NextResponse.json(result);
}

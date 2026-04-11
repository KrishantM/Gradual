import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';
import { getCareerContext } from '@/lib/copilot/get-career-context';
import { evaluateSignals } from '@/lib/copilot/evaluate-signals';
import { calculateProfileCompletion } from '@/lib/profile-completion';
import { PATHS } from '@/lib/paths/catalog';
import { hydratePathProgress, pickActivePath } from '@/lib/paths/progress';
import type { PathState } from '@/lib/paths/types';

interface DashboardSignal {
  key: string;
  level: 'HIGH' | 'MEDIUM' | 'OK';
  message: string;
}

const SIGNAL_MESSAGES: Record<string, Record<'HIGH' | 'MEDIUM' | 'OK', string>> = {
  profile: {
    HIGH: 'Your profile is incomplete — fill it in so Copilot can give better advice.',
    MEDIUM: 'Add your location to complete your profile.',
    OK: 'Profile is in good shape.',
  },
  cv: {
    HIGH: 'Your CV needs attention — upload or improve it to increase your chances.',
    MEDIUM: 'Your CV score could be stronger. Consider a review.',
    OK: 'CV looks good.',
  },
  applications: {
    HIGH: 'No recent applications — get active to build momentum.',
    MEDIUM: 'Application activity is low. Aim for at least one per week.',
    OK: 'Good application momentum.',
  },
  todos: {
    MEDIUM: 'No open career to-dos — add tasks to stay on track.',
    HIGH: 'No career to-dos set. Add priorities to your list.',
    OK: 'To-dos are on track.',
  },
};

function toSignalArray(raw: ReturnType<typeof evaluateSignals>): DashboardSignal[] {
  return Object.entries(raw.prioritySignals)
    .map(([key, level]) => {
      const lvl = level as 'HIGH' | 'MEDIUM' | 'OK';
      const message = SIGNAL_MESSAGES[key]?.[lvl] ?? `${key}: ${lvl}`;
      return { key, level: lvl, message };
    })
    .sort((a, b) => {
      const order = { HIGH: 0, MEDIUM: 1, OK: 2 };
      return order[a.level] - order[b.level];
    });
}

interface ActivePathSummary {
  pathId: string;
  pathTitle: string;
  outcome: string;
  progressPercent: number;
  completedCount: number;
  totalCount: number;
  currentModule: { id: string; title: string; estimatedMinutes: number } | null;
}

interface IntelligenceResponse {
  signals: DashboardSignal[];
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
  activePath: ActivePathSummary | null;
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
    signals: [],
    profileCompletion: 0,
    cvScore: null,
    latestCopilot: null,
    todayPlannerEvents: [],
    opportunityMomentum: { savedCount: 0, recentApplications: 0 },
    activePath: null,
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
      result.signals = toSignalArray(evaluateSignals(context));
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

  // Active capability path — degrades silently if path_state read fails
  try {
    const pathStateSnap = await db
      .collection('users')
      .doc(uid)
      .collection('path_state')
      .get();
    const stateMap = new Map<string, PathState>();
    type TS = { toDate?: () => Date } | Date | string | undefined;
    const toIso = (v: TS): string => {
      if (!v) return new Date().toISOString();
      if (typeof v === 'string') return v;
      if (typeof (v as { toDate?: () => Date }).toDate === 'function')
        return (v as { toDate: () => Date }).toDate().toISOString();
      if (v instanceof Date) return v.toISOString();
      return new Date().toISOString();
    };
    pathStateSnap.forEach((doc) => {
      const d = doc.data();
      const enrolledAt = toIso(d.enrolledAt as TS);
      stateMap.set(doc.id, {
        pathId: doc.id,
        enrolledAt,
        completedModuleIds: Array.isArray(d.completedModuleIds) ? d.completedModuleIds : [],
        currentModuleId: (d.currentModuleId as string) ?? null,
        pinned: Boolean(d.pinned),
        lastActivityAt: toIso((d.lastActivityAt as TS) ?? d.enrolledAt),
      });
    });
    if (stateMap.size > 0) {
      const progresses = PATHS.filter((p) => stateMap.has(p.id)).map((p) =>
        hydratePathProgress(p, stateMap.get(p.id) ?? null)
      );
      const active = pickActivePath(progresses);
      if (active) {
        result.activePath = {
          pathId: active.path.id,
          pathTitle: active.path.title,
          outcome: active.path.outcome,
          progressPercent: active.progressPercent,
          completedCount: active.completedCount,
          totalCount: active.totalCount,
          currentModule: active.currentModule
            ? {
                id: active.currentModule.id,
                title: active.currentModule.title,
                estimatedMinutes: active.currentModule.estimatedMinutes,
              }
            : null,
        };
      }
    }
  } catch (e) {
    console.error('[GET /api/dashboard/intelligence] activePath failed', e);
    result.degraded.push('activePath');
  }
  return NextResponse.json(result);
}

/**
 * GET /api/paths/recommendations
 *
 * Slow path — runs the recommendation engine using the user's career context.
 * Split off from /api/paths so the catalog grid can render immediately while
 * recommendations stream in.
 *
 * Lightweight version: only reads the user doc + applications/todos counts to
 * compute signals. Skips opportunity matching, copilot history, and active
 * paths since none are needed for path scoring.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';
import { recommendPaths } from '@/lib/paths/recommend';
import { evaluateSignals } from '@/lib/copilot/evaluate-signals';
import type { CareerContext } from '@/types/copilot';

type TimestampLike = { toDate?: () => Date } | Date | string;

function toISO(d: TimestampLike | null | undefined): string | null {
  if (!d) return null;
  if (typeof d === 'string') return d;
  const t = d as { toDate?: () => Date };
  if (typeof t.toDate === 'function') return t.toDate().toISOString();
  if (d instanceof Date) return d.toISOString();
  return null;
}

export async function GET(req: NextRequest) {
  let uid: string;
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await auth.verifyIdToken(authHeader.slice(7));
    uid = decoded.uid;
  } catch (e) {
    console.error('[GET /api/paths/recommendations] auth failed', e);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // excludePathIds (already enrolled) is taken from query string so the client
  // can pass what it knows from /api/paths — saves another path_state read here.
  const url = new URL(req.url);
  const excludeIds = (url.searchParams.get('exclude') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // Build a minimal career context — only the fields recommendPaths and
  // evaluateSignals actually look at. Everything else stays empty.
  const userRef = db.collection('users').doc(uid);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoISO = sevenDaysAgo.toISOString();

  const [userResult, appResult, todoResult] = await Promise.allSettled([
    userRef.get(),
    db.collection('applications').where('userId', '==', uid).orderBy('createdAt', 'desc').limit(50).get(),
    db.collection('actionItems').where('userId', '==', uid).orderBy('createdAt', 'desc').limit(100).get(),
  ]);

  const context: CareerContext = {
    user: { uid, timezone: undefined },
    profile: null,
    cv: null,
    jobPreferences: null,
    opportunities: { topMatches: [], saved: [] },
    applications: { active: [], recent: [] },
    todos: { open: [], completedRecently: [] },
    history: { recentCopilotSummaries: [] },
    activePaths: [],
  };

  if (userResult.status === 'fulfilled' && userResult.value.exists) {
    const userData = userResult.value.data() || {};
    context.profile = userData as Record<string, unknown>;

    const cvText = (userData as Record<string, unknown>).cvText as string | undefined;
    const cvScore = (userData as Record<string, unknown>).cvScore as number | undefined;
    if (cvText && String(cvText).trim() !== '') {
      context.cv = {
        id: 'default',
        uploadedAt: null,
        plaintext: String(cvText).slice(0, 5000),
        score: typeof cvScore === 'number' ? cvScore : undefined,
      };
    }
  }

  if (appResult.status === 'fulfilled') {
    appResult.value.forEach((doc) => {
      const d = doc.data();
      const createdAt = toISO(d.createdAt as TimestampLike) ?? String(d.createdAt ?? '');
      const app = {
        id: doc.id,
        company: String(d.company ?? ''),
        position: String(d.position ?? ''),
        stage: String(d.stage ?? ''),
        applyDate: String(d.applyDate ?? createdAt),
        jobUrl: d.jobUrl as string | undefined,
      };
      if (!['rejected', 'offered'].includes(app.stage)) context.applications.active.push(app);
      if (app.applyDate >= sevenDaysAgoISO) context.applications.recent.push(app);
    });
  }

  if (todoResult.status === 'fulfilled') {
    todoResult.value.forEach((doc) => {
      const d = doc.data();
      const createdAt = toISO(d.createdAt as TimestampLike) ?? String(d.createdAt ?? '');
      const todo = {
        id: doc.id,
        title: String(d.title ?? ''),
        notes: d.notes as string | undefined,
        priority: String(d.priority ?? 'medium'),
        dueDate: d.dueDate as string | undefined,
        status: (d.completed ? 'completed' : 'open') as string,
        createdAt,
        source: d.source as string | undefined,
      };
      if (todo.status !== 'completed') context.todos.open.push(todo);
      else if (todo.createdAt >= sevenDaysAgoISO) context.todos.completedRecently.push(todo);
    });
  }

  let recommendations: ReturnType<typeof recommendPaths> = [];
  try {
    const signals = evaluateSignals(context);
    recommendations = recommendPaths({
      context,
      signals,
      excludePathIds: excludeIds,
      limit: 3,
    });
  } catch (e) {
    console.error('[GET /api/paths/recommendations] scoring failed', e);
  }

  return NextResponse.json(
    { recommendations },
    { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=300' } }
  );
}

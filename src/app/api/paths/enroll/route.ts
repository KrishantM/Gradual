/**
 * POST /api/paths/enroll
 * Body: { pathId: string, addToPlanner?: boolean, startDateISO?: string }
 *
 * Creates the user's path_state document for this path. If addToPlanner is
 * true, also schedules planner_events for the first 3 modules starting on
 * startDateISO (or today, in the user's local date passed by the client).
 * Each event uses source: 'path' so the planner UI can render it distinctly.
 *
 * Idempotent: re-enrolling an existing path just refreshes lastActivityAt.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth, db } from '@/lib/firebase-admin';
import { getPathById } from '@/lib/paths/catalog';

const BodySchema = z.object({
  pathId: z.string().min(1).max(120),
  addToPlanner: z.boolean().optional().default(false),
  startDateISO: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

const PLANNER_PREFILL_MODULES = 3;

function addDaysISO(yyyyMmDd: string, days: number): string {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() + days);
  const yy = base.getUTCFullYear();
  const mm = String(base.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(base.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

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
    const { pathId, addToPlanner } = parseResult.data;
    const startDateISO = parseResult.data.startDateISO ?? new Date().toISOString().slice(0, 10);

    const path = getPathById(pathId);
    if (!path) {
      return NextResponse.json({ error: 'Unknown path' }, { status: 404 });
    }

    const pathStateRef = db.collection('users').doc(uid).collection('path_state').doc(pathId);
    const existing = await pathStateRef.get();

    const now = new Date();
    if (existing.exists) {
      // Re-enroll just bumps activity — preserve completed modules.
      await pathStateRef.set({ lastActivityAt: now }, { merge: true });
    } else {
      await pathStateRef.set({
        enrolledAt: now,
        lastActivityAt: now,
        completedModuleIds: [],
        currentModuleId: path.modules[0]?.id ?? null,
        pinned: false,
      });
    }

    // Optionally schedule the first few modules into the planner
    let plannerCreated = 0;
    if (addToPlanner) {
      const eventsRef = db.collection('users').doc(uid).collection('planner_events');
      const modulesToSchedule = path.modules.slice(0, PLANNER_PREFILL_MODULES);
      // Stagger across consecutive days starting from startDateISO
      const writes = modulesToSchedule.map((m, i) =>
        eventsRef.add({
          date: addDaysISO(startDateISO, i),
          title: `[${path.title}] ${m.title}`,
          notes: m.miniTask,
          source: 'path',
          pathId: path.id,
          moduleId: m.id,
          createdAt: now,
        })
      );
      const results = await Promise.all(writes);
      plannerCreated = results.length;
    }

    return NextResponse.json({ ok: true, pathId, plannerCreated });
  } catch (e) {
    console.error('[POST /api/paths/enroll]', e);
    return NextResponse.json({ error: 'Failed to enroll' }, { status: 500 });
  }
}

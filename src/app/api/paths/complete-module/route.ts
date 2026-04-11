/**
 * POST /api/paths/complete-module
 * Body: { pathId: string, moduleId: string }
 *
 * Marks a module complete on the user's path_state, advances currentModuleId
 * to the next incomplete module, and bumps lastActivityAt. Idempotent: a
 * second completion of the same module is a no-op.
 *
 * Returns { ok: true, completedCount, totalCount, currentModuleId, isPathComplete }.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth, db } from '@/lib/firebase-admin';
import { getPathById } from '@/lib/paths/catalog';
import { FieldValue } from 'firebase-admin/firestore';

const BodySchema = z.object({
  pathId: z.string().min(1).max(120),
  moduleId: z.string().min(1).max(120),
});

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
    const { pathId, moduleId } = parseResult.data;

    const path = getPathById(pathId);
    if (!path) {
      return NextResponse.json({ error: 'Unknown path' }, { status: 404 });
    }
    const moduleExists = path.modules.some((m) => m.id === moduleId);
    if (!moduleExists) {
      return NextResponse.json({ error: 'Unknown module' }, { status: 404 });
    }

    const ref = db.collection('users').doc(uid).collection('path_state').doc(pathId);
    const snap = await ref.get();
    const existing = snap.exists ? snap.data() : null;
    const completedSet = new Set<string>(
      Array.isArray(existing?.completedModuleIds) ? (existing!.completedModuleIds as string[]) : []
    );
    completedSet.add(moduleId);

    // Compute next incomplete module pointer
    const nextModule = path.modules.find((m) => !completedSet.has(m.id));
    const isPathComplete = nextModule == null;

    const now = new Date();
    if (snap.exists) {
      await ref.update({
        completedModuleIds: FieldValue.arrayUnion(moduleId),
        currentModuleId: nextModule?.id ?? null,
        lastActivityAt: now,
      });
    } else {
      // Auto-enroll on first completion (defensive — UI should normally enroll first)
      await ref.set({
        enrolledAt: now,
        lastActivityAt: now,
        completedModuleIds: [moduleId],
        currentModuleId: nextModule?.id ?? null,
        pinned: false,
      });
    }

    return NextResponse.json({
      ok: true,
      completedCount: completedSet.size,
      totalCount: path.modules.length,
      currentModuleId: nextModule?.id ?? null,
      isPathComplete,
    });
  } catch (e) {
    console.error('[POST /api/paths/complete-module]', e);
    return NextResponse.json({ error: 'Failed to complete module' }, { status: 500 });
  }
}

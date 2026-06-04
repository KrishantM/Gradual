/**
 * POST /api/copilot/confirm
 *
 * Executes (or declines) an action G.ai proposed while in `confirm` autonomy.
 * Proposed actions are stored at users/{uid}/copilot_pending/{id} by the agent
 * loop. This route re-validates the stored arguments and runs the tool, so the
 * client only ever passes an opaque pendingId — it cannot tamper with the
 * action's parameters.
 *
 * Body: { pendingId: string, decline?: boolean, clientDateISO?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth, db } from '@/lib/firebase-admin';
import { getCareerContext } from '@/lib/copilot/get-career-context';
import { getTool, type ToolRunContext } from '@/lib/copilot/agent/tools';
import { PENDING_TTL_MS } from '@/lib/copilot/agent/run-agent';

const UNDO_TTL_MS = 5 * 60 * 1000;

const BodySchema = z.object({
  pendingId: z.string().min(1).max(200),
  decline: z.boolean().optional(),
  clientDateISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await auth.verifyIdToken(authHeader.slice(7));
    const uid = decoded.uid;

    const parseResult = BodySchema.safeParse(await req.json());
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }
    const { pendingId, decline, clientDateISO } = parseResult.data;

    const pendingRef = db.collection('users').doc(uid).collection('copilot_pending').doc(pendingId);
    const pendingSnap = await pendingRef.get();
    if (!pendingSnap.exists) {
      return NextResponse.json({ error: 'This action is no longer available.' }, { status: 404 });
    }
    const pending = pendingSnap.data() ?? {};

    // Declining just discards the proposed action.
    if (decline) {
      await pendingRef.delete();
      return NextResponse.json({ ok: true, declined: true });
    }

    // Expiry guard.
    const createdAt = (pending.createdAt as { toDate?: () => Date })?.toDate?.();
    if (createdAt && Date.now() - createdAt.getTime() > PENDING_TTL_MS) {
      await pendingRef.delete();
      return NextResponse.json({ error: 'This action expired. Ask G.ai again.' }, { status: 410 });
    }

    const tool = getTool(String(pending.tool ?? ''));
    if (!tool) {
      await pendingRef.delete();
      return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
    }

    // Re-validate the stored arguments — never trust persisted data blindly.
    const validation = tool.validate(pending.data ?? {});
    if (!validation.ok) {
      await pendingRef.delete();
      return NextResponse.json({ error: 'This action is no longer valid.' }, { status: 400 });
    }

    const career = await getCareerContext(uid);
    const ctx: ToolRunContext = {
      uid,
      career,
      todayISO: clientDateISO ?? new Date().toISOString().slice(0, 10),
    };

    const result = await tool.execute(ctx, validation.data);
    await pendingRef.delete();

    // Bundle any reversible writes into an undo token.
    let undoToken: string | undefined;
    let undoExpiresAt: string | undefined;
    if (result.ok && result.undoRefs?.length) {
      undoToken = crypto.randomUUID();
      undoExpiresAt = new Date(Date.now() + UNDO_TTL_MS).toISOString();
      await db.collection('users').doc(uid).collection('copilot_undo').doc(undoToken).set({
        refs: result.undoRefs,
        createdAt: new Date(),
      });
    }

    return NextResponse.json({
      ok: result.ok,
      detail: result.detail,
      tool: tool.name,
      undoToken,
      undoExpiresAt,
    });
  } catch (e) {
    console.error('[POST /api/copilot/confirm]', e);
    return NextResponse.json({ error: 'Failed to confirm action' }, { status: 500 });
  }
}

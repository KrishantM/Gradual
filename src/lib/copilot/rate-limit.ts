/**
 * Firestore-backed rate limiter + daily AI budget for G.ai.
 *
 * Replaces the previous in-memory `Map` limiter, which was broken on Vercel
 * serverless: each lambda instance kept its own `Map`, so the per-user cap was
 * effectively per-instance and reset on every cold start. This version stores
 * usage state in Firestore and mutates it inside a transaction, so the cap is
 * genuinely per-user and shared across every serverless instance.
 *
 * State lives at users/{uid}/copilot_state/usage:
 *   { windowStartedAt, windowCount, day, dayCount, updatedAt }
 */

import { db } from '../../../lib/firebase-admin';

/** Per-minute burst window — protects against rapid-fire abuse. */
const MINUTE_WINDOW_MS = 60_000;
const MINUTE_MAX = 20;

/** Moderate per-user daily AI budget — the real ceiling on API spend. */
export const DAILY_MAX = 50;

export type RateLimitDecision =
  | { ok: true; dayCount: number; dailyRemaining: number }
  | { ok: false; reason: 'rate' | 'daily'; retryAfterMs: number; message: string };

/** UTC day key, e.g. "2026-05-16". */
function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Milliseconds from `now` until the next UTC midnight (when the daily budget resets). */
function msUntilUtcMidnight(now: number): number {
  const next = new Date(now);
  next.setUTCHours(24, 0, 0, 0);
  return next.getTime() - now;
}

/**
 * Atomically check the per-minute and per-day caps and, if allowed, consume one
 * unit of budget. Runs inside a Firestore transaction so concurrent requests
 * from the same user cannot race past the limit.
 *
 * Fails open (allows the request) only if the Firestore transaction itself
 * errors — a flaky datastore should not lock a user out of the product.
 */
export async function checkAndConsume(uid: string): Promise<RateLimitDecision> {
  const ref = db.collection('users').doc(uid).collection('copilot_state').doc('usage');
  try {
    return await db.runTransaction<RateLimitDecision>(async (tx) => {
      const snap = await tx.get(ref);
      const now = Date.now();
      const today = dayKey(new Date(now));
      const data = (snap.exists ? snap.data() : null) ?? {};

      let windowStartedAt = typeof data.windowStartedAt === 'number' ? data.windowStartedAt : 0;
      let windowCount = typeof data.windowCount === 'number' ? data.windowCount : 0;
      let day = typeof data.day === 'string' ? data.day : '';
      let dayCount = typeof data.dayCount === 'number' ? data.dayCount : 0;

      // Roll the per-minute window if it has elapsed.
      if (now - windowStartedAt >= MINUTE_WINDOW_MS) {
        windowStartedAt = now;
        windowCount = 0;
      }
      // Roll the daily budget at the UTC date boundary.
      if (day !== today) {
        day = today;
        dayCount = 0;
      }

      // Daily budget — checked before consuming.
      if (dayCount >= DAILY_MAX) {
        return {
          ok: false,
          reason: 'daily',
          retryAfterMs: msUntilUtcMidnight(now),
          message: "You've reached today's G.ai usage limit. It resets tomorrow — your progress is saved.",
        };
      }
      // Per-minute burst cap.
      if (windowCount >= MINUTE_MAX) {
        return {
          ok: false,
          reason: 'rate',
          retryAfterMs: MINUTE_WINDOW_MS - (now - windowStartedAt),
          message: "You're sending messages too quickly. Give G.ai a moment to catch up.",
        };
      }

      windowCount += 1;
      dayCount += 1;
      tx.set(
        ref,
        { windowStartedAt, windowCount, day, dayCount, updatedAt: new Date() },
        { merge: true }
      );
      return { ok: true, dayCount, dailyRemaining: DAILY_MAX - dayCount };
    });
  } catch (e) {
    console.error('[rate-limit] transaction failed — failing open', e);
    return { ok: true, dayCount: 0, dailyRemaining: DAILY_MAX };
  }
}

/** Read current daily usage without consuming budget — for surfacing remaining quota in the UI. */
export async function peekDailyUsage(uid: string): Promise<{ used: number; remaining: number; max: number }> {
  try {
    const ref = db.collection('users').doc(uid).collection('copilot_state').doc('usage');
    const snap = await ref.get();
    const data = (snap.exists ? snap.data() : null) ?? {};
    const today = dayKey(new Date());
    const used = data.day === today && typeof data.dayCount === 'number' ? data.dayCount : 0;
    return { used, remaining: Math.max(0, DAILY_MAX - used), max: DAILY_MAX };
  } catch {
    return { used: 0, remaining: DAILY_MAX, max: DAILY_MAX };
  }
}

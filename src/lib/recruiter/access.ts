/**
 * Recruiter access control — TEMPORARY DEMO LAYER
 * ==================================================
 *
 * This module gates recruiter-only features behind a lightweight allow-list /
 * subscription check. It intentionally lives *next to* the existing
 * `RecruiterAuthService` rather than replacing it — so we can ship the demo
 * without ripping out working logic.
 *
 * ⚠️  Replace before production:
 *   - The demo bypass list should move to Firebase custom claims or a
 *     dedicated `recruiter_access` Firestore collection with audit trails.
 *   - The "verified + subscriptionStatus active" check should be wired to a
 *     real Stripe/billing integration.
 *
 * Usage:
 *   - Server: `await assertRecruiterAccess(token)` inside API routes.
 *   - Client: `canAccessRecruiterFeatures(user, recruiterProfile)` to decide
 *             whether to render the paywall.
 */
import { auth, db } from '../../../lib/firebase-admin';
import type { RecruiterProfile } from '@/types/recruiter';

/**
 * Demo allow-list. Each email here can access recruiter features without an
 * active subscription. Lower-cased on lookup so case-mismatch doesn't lock
 * the founder out mid-demo.
 */
const RECRUITER_DEMO_BYPASS_EMAILS: readonly string[] = [
  'admin@gradual.co.nz',
] as const;

export function isRecruiterDemoBypass(email: string | null | undefined): boolean {
  if (!email) return false;
  return RECRUITER_DEMO_BYPASS_EMAILS.includes(email.trim().toLowerCase());
}

export type RecruiterAccessReason =
  | 'demo_bypass'
  | 'subscription_active'
  | 'no_profile'
  | 'profile_incomplete'
  | 'subscription_inactive'
  | 'unauthenticated';

export interface RecruiterAccessResult {
  hasAccess: boolean;
  reason: RecruiterAccessReason;
  isDemo: boolean;
}

/**
 * Pure function — works with the data the server already loaded. Used by
 * both server-side gates and (mirrored on the client) the paywall renderer.
 */
export function evaluateRecruiterAccess(args: {
  email: string | null | undefined;
  recruiterProfile: RecruiterProfile | null;
}): RecruiterAccessResult {
  const { email, recruiterProfile } = args;

  if (isRecruiterDemoBypass(email)) {
    return { hasAccess: true, reason: 'demo_bypass', isDemo: true };
  }

  if (!recruiterProfile) {
    return { hasAccess: false, reason: 'no_profile', isDemo: false };
  }

  const isPaidTier =
    recruiterProfile.subscriptionTier === 'basic' ||
    recruiterProfile.subscriptionTier === 'premium' ||
    recruiterProfile.subscriptionTier === 'enterprise';

  const isActive = recruiterProfile.subscriptionStatus === 'active';

  if (!isPaidTier || !isActive) {
    return { hasAccess: false, reason: 'subscription_inactive', isDemo: false };
  }

  return { hasAccess: true, reason: 'subscription_active', isDemo: false };
}

/**
 * Server-side helper. Verifies the Firebase token, decides access, and
 * returns the access result + decoded uid/email for the route to use.
 *
 * Throws nothing — returns `hasAccess: false` for any failure path so callers
 * can render the paywall response without try/catch boilerplate.
 */
export async function resolveRecruiterAccessFromToken(
  bearerToken: string | null | undefined
): Promise<{
  uid: string | null;
  email: string | null;
  access: RecruiterAccessResult;
}> {
  if (!bearerToken) {
    return {
      uid: null,
      email: null,
      access: { hasAccess: false, reason: 'unauthenticated', isDemo: false },
    };
  }

  let uid: string;
  let email: string | null = null;
  try {
    const decoded = await auth.verifyIdToken(bearerToken);
    uid = decoded.uid;
    email = decoded.email ?? null;
  } catch {
    return {
      uid: null,
      email: null,
      access: { hasAccess: false, reason: 'unauthenticated', isDemo: false },
    };
  }

  // Bypass first — avoids a Firestore read for the demo user.
  if (isRecruiterDemoBypass(email)) {
    return {
      uid,
      email,
      access: { hasAccess: true, reason: 'demo_bypass', isDemo: true },
    };
  }

  let recruiterProfile: RecruiterProfile | null = null;
  try {
    const snap = await db.collection('recruiters').doc(uid).get();
    if (snap.exists) {
      recruiterProfile = snap.data() as RecruiterProfile;
    }
  } catch (e) {
    console.error('[recruiter access] failed to load profile', e);
  }

  return {
    uid,
    email,
    access: evaluateRecruiterAccess({ email, recruiterProfile }),
  };
}

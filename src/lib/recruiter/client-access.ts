/**
 * Client-side mirror of the recruiter demo allow-list.
 *
 * Used by recruiter pages to render the paywall optimistically while the
 * server-side `/api/recruiter/access` round-trip resolves. The server
 * remains the source of truth — this is purely for first-paint UX.
 */

const DEMO_BYPASS_EMAILS_LOWER: readonly string[] = [
  'admin@gradual.co.nz',
];

export function isRecruiterDemoBypassEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return DEMO_BYPASS_EMAILS_LOWER.includes(email.trim().toLowerCase());
}

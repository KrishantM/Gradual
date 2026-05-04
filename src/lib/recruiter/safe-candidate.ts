/**
 * Recruiter-safe candidate preview
 * ==================================
 *
 * Single source of truth for *what data a recruiter can see about a student*.
 * Anything not in `RecruiterCandidatePreview` MUST NOT be shipped to recruiter
 * UI, props, logs, or debug panels.
 *
 * Privacy-by-default: this sanitizer is the only path raw user docs may take
 * before reaching a recruiter response. New fields are opt-in.
 */

export interface RecruiterCandidatePreview {
  /** Stable id (Firestore uid) */
  id: string;

  /** Display name only — surname removed unless explicitly safe to show */
  displayName: string;

  /** Optional initials for avatar (eg. "KM") */
  initials: string;

  /** Short headline pulled from `bio` — first sentence, max ~140 chars */
  headline: string | null;

  /** Broad academic context. Degree only, no GPA, no graduation date. */
  studyArea: string | null;

  /** City/region only — never full address */
  region: string | null;

  /** Highest CV score (0–100). Null if unscored. */
  cvScore: number | null;

  /** Up to 3 high-level industry interest labels */
  interests: string[];

  /** Up to 5 broad skill tags — never raw CV bullet text */
  skills: string[];

  /** 0–100, computed elsewhere. Indicates how "ready" the candidate looks. */
  readiness: number | null;

  /** ISO date of last meaningful update — never the raw timestamp obj */
  lastActiveISO: string | null;
}

/* ─── Helpers ────────────────────────────────────────────── */

function asString(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function trimToFirstSentence(text: string, maxLen = 140): string | null {
  const cleaned = text.trim();
  if (!cleaned) return null;
  // Split on sentence terminators or newline.
  const firstSentence = cleaned.split(/[.!?\n]/)[0] ?? cleaned;
  const truncated = firstSentence.length > maxLen
    ? `${firstSentence.slice(0, maxLen - 1).trimEnd()}…`
    : firstSentence;
  return truncated.trim() || null;
}

function buildDisplayName(fullName: string): string {
  const cleaned = fullName.trim();
  if (!cleaned) return 'Candidate';
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) return parts[0];
  // Show first name + initial of last name only — eg. "Jordan M."
  const first = parts[0];
  const lastInitial = parts[parts.length - 1]?.[0] ?? '';
  return lastInitial ? `${first} ${lastInitial}.` : first;
}

function buildInitials(fullName: string): string {
  const cleaned = fullName.trim();
  if (!cleaned) return 'C';
  const parts = cleaned.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || 'C';
}

function parseTags(input: unknown, max: number): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input
      .map((s) => asString(s).trim())
      .filter(Boolean)
      .slice(0, max);
  }
  if (typeof input === 'string') {
    return input
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, max);
  }
  return [];
}

function pickRegion(data: Record<string, unknown>): string | null {
  const city = asString(data.city).trim();
  const country = asString(data.country).trim();
  if (city && country) return `${city}, ${country}`;
  return city || country || null;
}

function pickCvScore(data: Record<string, unknown>): number | null {
  const candidates = [data.cvScore, data.highestCvScore, data.cvBaselineScore];
  for (const v of candidates) {
    if (typeof v === 'number' && Number.isFinite(v)) {
      return Math.max(0, Math.min(100, Math.round(v)));
    }
  }
  return null;
}

function pickReadiness(data: Record<string, unknown>): number | null {
  const v = data.profileCompletion;
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function pickLastActiveISO(data: Record<string, unknown>): string | null {
  const candidates = [data.updatedAt, data.lastUpdatedAt, data.createdAt];
  for (const v of candidates) {
    if (!v) continue;
    if (typeof v === 'string') return v;
    if (v instanceof Date) return v.toISOString();
    const t = v as { toDate?: () => Date };
    if (typeof t?.toDate === 'function') return t.toDate().toISOString();
  }
  return null;
}

/* ─── Public sanitizer ───────────────────────────────────── */

/**
 * The ONLY function permitted to translate a raw `users/{uid}` Firestore
 * document into a recruiter-visible payload. Drops everything not on the
 * allowlist below.
 *
 * Fields explicitly NOT exposed:
 *   - email, phoneNumber, address
 *   - cvText, raw CV content, cvUrl
 *   - applications, planner events, copilot conversations
 *   - any private notes / AI outputs
 *   - exact age / DOB
 */
export function getRecruiterSafeCandidate(
  uid: string,
  raw: Record<string, unknown> | null | undefined
): RecruiterCandidatePreview {
  const data = raw ?? {};
  const fullName = asString(data.fullName) || asString(data.displayName);
  const bio = asString(data.bio);

  return {
    id: uid,
    displayName: buildDisplayName(fullName),
    initials: buildInitials(fullName),
    headline: trimToFirstSentence(bio),
    studyArea: asString(data.degree).trim() || null,
    region: pickRegion(data),
    cvScore: pickCvScore(data),
    interests: parseTags(data.preferredIndustries, 3),
    skills: parseTags(data.skills, 5),
    readiness: pickReadiness(data),
    lastActiveISO: pickLastActiveISO(data),
  };
}

/**
 * Thin helper that lets us pass `Pick`-like field projections to Firestore
 * without forgetting which fields the sanitizer reads from. Centralised so
 * a future `select()` query stays in sync with the allowlist.
 */
export const RECRUITER_SAFE_FIELDS = [
  'fullName',
  'displayName',
  'bio',
  'degree',
  'city',
  'country',
  'cvScore',
  'highestCvScore',
  'cvBaselineScore',
  'preferredIndustries',
  'skills',
  'profileCompletion',
  'updatedAt',
  'lastUpdatedAt',
  'createdAt',
  // Privacy gate flags — read for filtering, not exposed:
  'isProfilePublic',
  'allowRecruiterContact',
] as const;

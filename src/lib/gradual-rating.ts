/**
 * Gradual Rating — single deterministic score used across the product.
 *
 * Both the dashboard "Career Readiness" tile and the profile "Gradual Rating"
 * card read from this function so the numbers always match. Pure / synchronous /
 * client + server safe — no Firebase imports.
 *
 * Score is a weighted average over six components. Each component is itself
 * 0–100, so the final score is also 0–100 and trivial to explain to users.
 *
 * Components:
 *   1. CV Score             — your scored CV (0–100), 0 if no CV.
 *   2. Academic             — GPA on a 0–100 scale + degree/university bonus.
 *   3. Professional         — bio depth + breadth of declared interests.
 *   4. Digital Presence     — portfolio / external links presence.
 *   5. Profile Completeness — fraction of the 11 core profile fields filled.
 *   6. Paths Progress       — average % progress across enrolled capability
 *                             paths. Zero when not enrolled in anything,
 *                             which on purpose nudges users to start one.
 */

import { calculateProfileCompletion } from './profile-completion';

export type GradualRatingComponentKey =
  | 'cv'
  | 'academic'
  | 'professional'
  | 'digital'
  | 'completeness'
  | 'paths';

export interface GradualRatingComponent {
  key: GradualRatingComponentKey;
  label: string;
  /** 0–100 */
  value: number;
  /** Relative weight in the overall average. Equal weights today. */
  weight: number;
  /** Short, user-facing line about how this component is computed. */
  rationale: string;
}

export interface GradualRating {
  /** 0–100 — overall score. */
  total: number;
  components: GradualRatingComponent[];
}

export interface GradualRatingInput {
  profile: Record<string, unknown> | null | undefined;
  cvScore: number | null | undefined;
  /**
   * Optional list of enrolled capability paths and their progress percent
   * (0–100). Pass an empty array if the user has no enrollments.
   */
  pathProgresses?: { progressPercent: number }[];
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

function gpaToPercent(gpa: number, scale: string): number {
  if (Number.isNaN(gpa) || gpa < 0) return 0;
  if (scale === '100') return Math.round(Math.min(gpa, 100));
  if (scale === 'other') return 0;
  const map: Record<string, number> = {
    '4.0': 4,
    '5.0': 5,
    '7.0': 7,
    '9.0': 9,
    '10.0': 10,
  };
  const max = map[scale];
  if (!max) return Math.round(Math.min(gpa, 100));
  return Math.round(Math.min((gpa / max) * 100, 100));
}

function computeAcademic(profile: Record<string, unknown>): number {
  let score = 0;
  const gpaRaw = profile.gpa;
  const gpaScale = asString(profile.gpaScale) || '4.0';
  const gpaNum = typeof gpaRaw === 'number' ? gpaRaw : parseFloat(asString(gpaRaw));
  if (!Number.isNaN(gpaNum) && gpaScale !== 'other') {
    score = gpaToPercent(gpaNum, gpaScale);
  }
  if (asString(profile.degree).trim() && asString(profile.university).trim()) {
    score = Math.min(100, score + 10);
  }
  return score;
}

function computeProfessional(profile: Record<string, unknown>): number {
  const bio = asString(profile.bio);
  let score = 0;
  if (bio.length > 150) score = 100;
  else if (bio.length > 100) score = 80;
  else if (bio.length > 50) score = 60;
  const interests = asString(profile.interests)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (interests.length >= 3) score = Math.min(100, score + 15);
  return score;
}

function computeDigital(profile: Record<string, unknown>): number {
  const portfolio = asString(profile.portfolioLinks).trim();
  if (portfolio !== '') return 100;
  const bio = asString(profile.bio);
  if (bio.length > 100) return 70;
  if (bio.length > 50) return 50;
  return 0;
}

function computePaths(progresses: { progressPercent: number }[] | undefined): number {
  if (!progresses || progresses.length === 0) return 0;
  const total = progresses.reduce((s, p) => s + (p.progressPercent || 0), 0);
  return Math.round(total / progresses.length);
}

export function calculateGradualRating(input: GradualRatingInput): GradualRating {
  const profile = input.profile ?? {};

  const cv: GradualRatingComponent = {
    key: 'cv',
    label: 'CV Score',
    value: typeof input.cvScore === 'number' ? Math.max(0, Math.min(100, input.cvScore)) : 0,
    weight: 1,
    rationale: 'Your CV upload, scored 0–100. Improve it via the CV Score tool.',
  };

  const academic: GradualRatingComponent = {
    key: 'academic',
    label: 'Academic',
    value: computeAcademic(profile as Record<string, unknown>),
    weight: 1,
    rationale: 'GPA on a 100-point scale, plus a small bonus for declaring degree + university.',
  };

  const professional: GradualRatingComponent = {
    key: 'professional',
    label: 'Professional Identity',
    value: computeProfessional(profile as Record<string, unknown>),
    weight: 1,
    rationale: 'Depth of your bio plus breadth of declared interests (3+).',
  };

  const digital: GradualRatingComponent = {
    key: 'digital',
    label: 'Digital Presence',
    value: computeDigital(profile as Record<string, unknown>),
    weight: 1,
    rationale: 'Whether you\'ve linked a portfolio or external profile (LinkedIn, GitHub, etc.).',
  };

  const completeness: GradualRatingComponent = {
    key: 'completeness',
    label: 'Profile Completeness',
    value: calculateProfileCompletion((profile as Record<string, unknown>) ?? {}),
    weight: 1,
    rationale: 'Fraction of the 11 core profile fields you\'ve filled in.',
  };

  const paths: GradualRatingComponent = {
    key: 'paths',
    label: 'Paths Progress',
    value: computePaths(input.pathProgresses),
    weight: 1,
    rationale: 'Average completion across the capability paths you\'re enrolled in.',
  };

  const components = [cv, academic, professional, digital, completeness, paths];
  const totalWeight = components.reduce((s, c) => s + c.weight, 0);
  const weightedSum = components.reduce((s, c) => s + c.value * c.weight, 0);
  const total = Math.round(weightedSum / totalWeight);

  return { total, components };
}

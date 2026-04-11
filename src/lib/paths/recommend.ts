/**
 * Recommendation engine for capability paths.
 *
 * Pure, deterministic, no LLM. Scores each path against the user's profile
 * (interests, preferred industries, bio) and signal weaknesses. Returns the
 * top N paths with human-readable reasons explaining why each was picked.
 */

import { PATHS } from './catalog';
import type { Path, PathRecommendation, SignalKey } from './types';
import type { CareerContext } from '@/types/copilot';
import type { CopilotSignals } from '@/types/copilot';

interface RecommendInput {
  context: CareerContext;
  signals?: CopilotSignals;
  excludePathIds?: string[];
  limit?: number;
}

function normalizeText(s: unknown): string {
  if (typeof s !== 'string') return '';
  return s.toLowerCase().replace(/[^a-z0-9\s,]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Build a single haystack string from the user's profile signals. */
function buildUserHaystack(context: CareerContext): string {
  const profile = (context.profile as Record<string, unknown>) ?? {};
  const parts = [
    profile.preferredIndustries,
    profile.interests,
    profile.bio,
    profile.degree,
    profile.university,
    profile.targetRoles,
  ];
  return parts.map(normalizeText).filter(Boolean).join(' ');
}

/** Substring tag-match scorer. Returns matched tags. */
function matchAudience(path: Path, haystack: string): string[] {
  const matched: string[] = [];
  for (const tag of path.targetAudience) {
    const normTag = normalizeText(tag);
    if (normTag && haystack.includes(normTag)) {
      matched.push(tag);
    }
  }
  return matched;
}

/** Returns the signal keys this path improves AND user is currently weak in. */
function matchSignalGaps(path: Path, signals?: CopilotSignals): SignalKey[] {
  if (!signals?.prioritySignals) return [];
  const weak: SignalKey[] = [];
  for (const sig of path.improvesSignals) {
    const level = signals.prioritySignals[sig];
    if (level === 'HIGH' || level === 'MEDIUM') {
      weak.push(sig);
    }
  }
  return weak;
}

const SIGNAL_LABEL: Record<SignalKey, string> = {
  profile: 'profile completeness',
  cv: 'CV strength',
  applications: 'application momentum',
  todos: 'career task tracking',
};

export function recommendPaths(input: RecommendInput): PathRecommendation[] {
  const { context, signals, excludePathIds = [], limit = 3 } = input;
  const haystack = buildUserHaystack(context);
  const excludeSet = new Set(excludePathIds);

  const scored: PathRecommendation[] = [];

  for (const path of PATHS) {
    if (excludeSet.has(path.id)) continue;

    const matchedTags = matchAudience(path, haystack);
    const gapSignals = matchSignalGaps(path, signals);

    // Scoring: each audience tag = 3, each gap signal = 2, base = 1
    const score = 1 + matchedTags.length * 3 + gapSignals.length * 2;

    const reasons: string[] = [];
    if (matchedTags.length > 0) {
      reasons.push(
        `Matches your interest in ${matchedTags.slice(0, 2).join(' and ')}`
      );
    }
    if (gapSignals.length > 0) {
      reasons.push(
        `Strengthens your ${gapSignals.map((s) => SIGNAL_LABEL[s]).join(' and ')}`
      );
    }
    if (reasons.length === 0) {
      reasons.push('A foundational path most early-career users benefit from');
    }

    scored.push({ path, score, reasons });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

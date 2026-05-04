/**
 * AI-generated career pathways — types shared between API, Firestore, and UI.
 *
 * A "pathway" is distinct from a "Path" (capability path):
 *   - A Path is a static, hand-curated short course (4–6 modules).
 *   - A Pathway is a personalised, goal-driven roadmap generated for a user
 *     and laid out across 5 horizons (now, 30 days, 3 months, 6 months, 12 months).
 *
 * Pathways live in Firestore at users/{uid}/generated_pathways/{pathwayId}.
 */

export type HorizonKey = 'now' | '30d' | '3mo' | '6mo' | '12mo';

export const HORIZON_ORDER: HorizonKey[] = ['now', '30d', '3mo', '6mo', '12mo'];

export const HORIZON_LABEL: Record<HorizonKey, string> = {
  now: 'Now',
  '30d': '30 days',
  '3mo': '3 months',
  '6mo': '6 months',
  '12mo': '12 months',
};

export const HORIZON_HELPER: Record<HorizonKey, string> = {
  now: 'Start this week',
  '30d': 'Build momentum',
  '3mo': 'Show real progress',
  '6mo': 'Substantive proof',
  '12mo': 'Goal in reach',
};

/** A single step on the pathway. Steps live inside a horizon. */
export interface PathwayStep {
  /** Stable id, unique within the pathway */
  id: string;
  /** What the user will do — short, imperative */
  title: string;
  /** Why this matters now — 1–2 sentences */
  rationale: string;
  /** What kind of step this is — drives icon and grouping */
  kind: 'skill' | 'project' | 'learning' | 'experience' | 'opportunity';
  /** Optional concrete suggestions of opportunities or resources to look for */
  suggestions?: string[];
}

export interface PathwayHorizon {
  key: HorizonKey;
  /** A 1-line summary of the horizon's outcome */
  outcome: string;
  steps: PathwayStep[];
}

/**
 * The full generated pathway document.
 * Stored at users/{uid}/generated_pathways/{id}.
 */
export interface GeneratedPathway {
  id: string;
  /** User-facing title, e.g. "Path to Strategy Consultant" */
  title: string;
  /** The original goal the user typed */
  goal: string;
  /** Optional structured fields — empty strings allowed */
  targetRole?: string;
  targetIndustry?: string;
  /** 1–3 sentences explaining the strategic shape of the plan */
  summary: string;
  /** Always 5 horizons in HORIZON_ORDER order */
  horizons: PathwayHorizon[];
  /** ISO timestamp */
  createdAt: string;
  /** ISO timestamp — bumped when the pathway is opened or items moved to planner */
  lastViewedAt: string;
}

/** Lightweight summary used by saved-pathway list APIs */
export interface PathwaySummary {
  id: string;
  title: string;
  goal: string;
  createdAt: string;
  lastViewedAt: string;
  horizonCount: number;
  stepCount: number;
}

/**
 * Capability Paths — types shared between catalog, server APIs, and UI.
 *
 * A Path is a structured upskilling track. Each Path has 4–8 short Modules.
 * Modules are designed to be completable in 10–20 minutes each so users feel
 * momentum quickly. The catalog itself is static (TypeScript file). Per-user
 * progress lives in Firestore at users/{uid}/path_state/{pathId}.
 */

export type SignalKey = 'profile' | 'cv' | 'applications' | 'todos';

export type PathCategory =
  | 'ai-fluency'
  | 'technical'
  | 'job-search'
  | 'communication'
  | 'productivity';

export interface PathLesson {
  /** Section heading, e.g. "Why this matters" */
  heading: string;
  /** Markdown-lite body — supports paragraphs separated by blank lines */
  body: string;
  /** Optional bulleted list of examples or key points */
  bullets?: string[];
  /** Optional callout — shown as a highlighted info box */
  callout?: { label: string; text: string };
}

export interface PathQuizOption {
  text: string;
  isCorrect: boolean;
  /** Why this answer is right or wrong — shown after the user picks */
  explanation: string;
}

export interface PathQuizQuestion {
  /** Stable id within the module */
  id: string;
  prompt: string;
  options: PathQuizOption[];
  /** Optional hint shown if the user wants help before answering */
  hint?: string;
}

export interface PathModule {
  /** Stable id, unique within the path */
  id: string;
  /** Short title, ~3–6 words */
  title: string;
  /** 2–4 sentences explaining the concept */
  concept: string;
  /** One concrete action the user takes inside or outside Gradual */
  practicalAction: string;
  /** A small output the user produces — used as the planner task body */
  miniTask: string;
  /** Rough completion time in minutes */
  estimatedMinutes: number;
  /** Expanded course-style content — optional. If absent, viewer shows a
   *  graceful "richer lesson content coming soon" hint. */
  lessons?: PathLesson[];
  /** Bullet summary the user can take away after the lesson */
  keyTakeaways?: string[];
  /** Multiple-choice quiz — shown after lessons in the viewer */
  quiz?: PathQuizQuestion[];
}

export interface Path {
  id: string;
  title: string;
  /** One-line hook shown on cards */
  tagline: string;
  /** The "why" — what changes for the user when they finish */
  outcome: string;
  category: PathCategory;
  /**
   * Free-text tags matched (case-insensitive substring) against user's
   * preferredIndustries / interests / bio when scoring recommendations.
   */
  targetAudience: string[];
  /** Career signals this path measurably improves */
  improvesSignals: SignalKey[];
  /** Total estimated time across all modules */
  estimatedMinutes: number;
  modules: PathModule[];
}

/** Per-user, per-path state stored in Firestore */
export interface PathState {
  pathId: string;
  enrolledAt: string; // ISO
  completedModuleIds: string[];
  currentModuleId: string | null;
  /** When user pinned to dashboard. Null = not pinned. */
  pinned: boolean;
  lastActivityAt: string; // ISO
}

/** Hydrated view: Path + user state + computed fields, returned by APIs */
export interface PathProgress {
  path: Path;
  state: PathState | null;
  isEnrolled: boolean;
  completedCount: number;
  totalCount: number;
  progressPercent: number; // 0–100
  currentModule: PathModule | null;
  nextModule: PathModule | null;
}

export interface PathRecommendation {
  path: Path;
  score: number;
  reasons: string[]; // human-readable, e.g. "Matches your interest in consulting"
}

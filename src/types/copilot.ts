/**
 * Phase 1: Gradual Copilot — shared types for context, signals, and chat.
 */

/** Unified career context returned by GET /api/copilot/context */
export interface CareerContext {
  user: { uid: string; timezone?: string };
  profile: Record<string, unknown> | null;
  cv: { id: string; uploadedAt: string | null; plaintext: string; score?: number } | null;
  jobPreferences: Record<string, unknown> | null;
  opportunities: {
    topMatches: OpportunityMatch[];
    saved: OpportunityMatch[];
  };
  applications: {
    active: ApplicationSnapshot[];
    recent: ApplicationSnapshot[];
  };
  todos: {
    open: TodoSnapshot[];
    completedRecently: TodoSnapshot[];
  };
  history: {
    recentCopilotSummaries: CopilotSummary[];
  };
  /**
   * Phase 3 — capability paths the user is currently engaged with. Used by
   * the copilot prompt so it can reference active learning and avoid
   * suggesting things the user is already working on.
   */
  activePaths?: ActivePathContext[];
}

export interface ActivePathContext {
  pathId: string;
  pathTitle: string;
  outcome: string;
  progressPercent: number;
  currentModuleTitle: string | null;
}

export interface OpportunityMatch {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  type?: string;
  score?: number;
  description?: string;
}

export interface ApplicationSnapshot {
  id: string;
  company: string;
  position: string;
  stage: string;
  applyDate: string;
  jobUrl?: string;
}

export interface TodoSnapshot {
  id: string;
  title: string;
  notes?: string;
  priority: string;
  dueDate?: string;
  status: string;
  createdAt: string;
  source?: string;
}

export interface CopilotSummary {
  sessionId: string;
  createdAt: string;
  userMessage: string;
  assistantSummary: string;
  priorities?: string[];
  todosSuggested?: number;
}

/** Output of the rules/decision layer, injected into the prompt */
export interface CopilotSignals {
  prioritySignals: {
    cv?: 'HIGH' | 'MEDIUM' | 'LOW' | 'OK';
    applications?: 'HIGH' | 'MEDIUM' | 'LOW' | 'OK';
    profile?: 'HIGH' | 'MEDIUM' | 'LOW' | 'OK';
    todos?: 'HIGH' | 'MEDIUM' | 'LOW' | 'OK';
  };
  consultingFlags: {
    recommend: boolean;
    reasons: string[];
    ctaText?: string;
  };
}

/** Request body for POST /api/copilot/chat */
export interface CopilotChatRequest {
  message: string;
  mode: 'suggest' | 'assist';
}

/**
 * A single action G.ai's agent took or is proposing. Rendered in the UI as an
 * action card. `id` is the undo key for executed actions and the
 * copilot_pending doc id (confirm key) for proposed actions.
 */
export interface GaiAction {
  id: string;
  tool: string;
  tier: 'read' | 'reversible' | 'sensitive';
  label: string;
  status: 'executed' | 'proposed' | 'failed';
  detail?: string;
}

/** Response from POST /api/copilot/chat */
export interface CopilotChatResponse {
  answer: string;
  priorities: { title: string; rationale: string }[];
  suggestedTodos: { title: string; notes?: string; priority: string; dueDateISO?: string }[];
  suggestedOpportunities: {
    jobId: string;
    title: string;
    company: string;
    location: string;
    url: string;
    whyFit: string;
  }[];
  consultingRecommendation?: {
    recommended: boolean;
    reason: string;
    ctaText: string;
  };
  /** When user asks for a weekly plan: keys YYYY-MM-DD, values tasks for that day */
  weeklyPlan?: Record<string, { title: string; notes?: string }[]>;
  /** Only in assist mode when todos were auto-created */
  undoToken?: string;
  undoExpiresAt?: string;
  /** Agentic modes — actions G.ai executed this turn (full_auto). */
  executedActions?: GaiAction[];
  /** Agentic modes — actions awaiting user confirmation (confirm mode). */
  proposedActions?: GaiAction[];
  /** Suggested next-step prompts the user can tap to send as a follow-up. */
  followUps?: string[];
  /** Autonomy level that produced this response. */
  autonomy?: 'full_auto' | 'confirm' | 'manual';
}

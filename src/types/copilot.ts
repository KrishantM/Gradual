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
}

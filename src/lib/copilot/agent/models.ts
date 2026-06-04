/**
 * G.ai model routing.
 *
 * Two models, both overridable via environment variables so the deployment can
 * be retuned without a code change:
 *   GAI_MODEL_PRIMARY — frontier model for multi-step reasoning + planning.
 *   GAI_MODEL_FAST    — fast/cheap model for simple, single-shot turns.
 *
 * Defaults target the gpt-4.1 family rather than gpt-4o: 4.1 has stronger
 * tool-calling and instruction-following, a larger context window, and is both
 * cheaper and faster per token. If 4.1 is not enabled on the OpenAI account,
 * set GAI_MODEL_PRIMARY=gpt-4o (and GAI_MODEL_FAST=gpt-4o-mini) to revert.
 */

const PRIMARY = process.env.GAI_MODEL_PRIMARY?.trim() || 'gpt-4.1';
const FAST = process.env.GAI_MODEL_FAST?.trim() || 'gpt-4.1-mini';

export const GAI_MODELS = { primary: PRIMARY, fast: FAST } as const;

export interface ModelRouteInput {
  userMessage: string;
  /** Number of prior turns already in the conversation. */
  historyLength: number;
}

export interface ModelRoute {
  model: string;
  tier: 'fast' | 'primary';
  /** Short human-readable reason — surfaced in logs/analytics, not the UI. */
  reason: string;
}

// Substrings that signal a multi-step / action-heavy turn worth the frontier
// model. Kept lowercase; matched against the lowercased user message.
const COMPLEX_HINTS = [
  'plan', 'schedule', 'week', 'roadmap', 'organi', 'prioriti', 'strategy',
  'apply', 'application', 'enrol', 'compare', 'analy', 'review my',
  'step by step', 'break down', 'multiple', 'and then', 'build me',
];

/**
 * Zero-latency heuristic router. Classification is pure string inspection — it
 * adds no extra model round-trip (which would defeat the speed goal). Short,
 * single-intent questions go to the fast model; anything that smells
 * multi-step goes to the primary model.
 */
export function routeAgentModel(input: ModelRouteInput): ModelRoute {
  const msg = input.userMessage.toLowerCase();

  if (input.historyLength >= 4) {
    return { model: GAI_MODELS.primary, tier: 'primary', reason: 'deep conversation' };
  }
  if (input.userMessage.length > 280) {
    return { model: GAI_MODELS.primary, tier: 'primary', reason: 'long request' };
  }
  if (COMPLEX_HINTS.some((h) => msg.includes(h))) {
    return { model: GAI_MODELS.primary, tier: 'primary', reason: 'multi-step intent' };
  }
  return { model: GAI_MODELS.fast, tier: 'fast', reason: 'simple single-shot turn' };
}

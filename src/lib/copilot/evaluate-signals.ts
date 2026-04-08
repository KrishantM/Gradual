/**
 * Rules/Decision layer — pure function to compute priority signals and consulting flags
 * from Career Context. Run before calling the LLM; output is injected into the prompt.
 */

import type { CareerContext, CopilotSignals } from '@/types/copilot';

const CV_SCORE_LOW_THRESHOLD = 50;
const CV_SCORE_MED_THRESHOLD = 70;
const MIN_CV_WORDS = 100;
const RECENT_APPLICATIONS_OK = 1;
const REJECTION_RATIO_HIGH = 0.7;
const MIN_APPLICATIONS_FOR_REJECTION_FLAG = 3;

export function evaluateSignals(context: CareerContext): CopilotSignals {
  const signals: CopilotSignals = {
    prioritySignals: {},
    consultingFlags: { recommend: false, reasons: [] },
  };

  if (!context.profile || Object.keys(context.profile).length === 0) {
    signals.prioritySignals.profile = 'HIGH';
  } else {
    const p = context.profile as Record<string, unknown>;
    const hasName = !!p.fullName;
    const hasEdu = !!(p.university || p.degree);
    const hasLocation = !!(p.city || p.country);
    if (!hasName && !hasEdu) signals.prioritySignals.profile = 'HIGH';
    else if (!hasLocation) signals.prioritySignals.profile = 'MEDIUM';
    else signals.prioritySignals.profile = 'OK';
  }

  if (!context.cv) {
    signals.prioritySignals.cv = 'HIGH';
    signals.consultingFlags.reasons.push('No CV on file');
  } else {
    const score = context.cv.score;
    const words = (context.cv.plaintext || '').trim().split(/\s+/).length;
    if (score != null) {
      if (score < CV_SCORE_LOW_THRESHOLD) {
        signals.prioritySignals.cv = 'HIGH';
        signals.consultingFlags.reasons.push(`CV score is low (${score}/100)`);
      } else if (score < CV_SCORE_MED_THRESHOLD) {
        signals.prioritySignals.cv = 'MEDIUM';
      } else {
        signals.prioritySignals.cv = 'OK';
      }
    } else {
      signals.prioritySignals.cv = 'MEDIUM';
    }
    if (words < MIN_CV_WORDS && context.cv.plaintext) {
      signals.prioritySignals.cv = 'HIGH';
      if (!signals.consultingFlags.reasons.some((r) => r.includes('CV'))) {
        signals.consultingFlags.reasons.push('CV appears incomplete or very short');
      }
    }
  }

  const recentCount = context.applications?.recent?.length ?? 0;
  const activeCount = context.applications?.active?.length ?? 0;
  if (recentCount === 0) {
    signals.prioritySignals.applications = 'HIGH';
    signals.consultingFlags.reasons.push('No applications in the last 7 days');
  } else if (recentCount < RECENT_APPLICATIONS_OK) {
    signals.prioritySignals.applications = 'MEDIUM';
  } else {
    signals.prioritySignals.applications = 'OK';
  }

  const totalWithOutcome = (context.applications?.active ?? []).length + (context.applications?.recent ?? []).length;
  const rejected = [...(context.applications?.active ?? []), ...(context.applications?.recent ?? [])].filter(
    (a) => String(a.stage).toLowerCase() === 'rejected'
  ).length;
  if (totalWithOutcome >= MIN_APPLICATIONS_FOR_REJECTION_FLAG && rejected / totalWithOutcome >= REJECTION_RATIO_HIGH) {
    signals.consultingFlags.recommend = true;
    signals.consultingFlags.reasons.push('High proportion of rejections; 1:1 strategy could help');
  }

  const openTodos = context.todos?.open?.length ?? 0;
  if (openTodos === 0) {
    signals.prioritySignals.todos = 'MEDIUM';
  } else {
    signals.prioritySignals.todos = 'OK';
  }

  if (signals.consultingFlags.reasons.length > 0) {
    signals.consultingFlags.recommend = true;
    signals.consultingFlags.ctaText = 'Book a free 10-min fit check';
  }

  return signals;
}

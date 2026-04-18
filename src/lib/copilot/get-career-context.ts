/**
 * Career Context Aggregator — builds unified Career Context for Copilot.
 * Uses Firebase Admin. Call from server only.
 *
 * Assumptions:
 * - Profile/CV: users/{uid} (fullName, university, degree, cvText, cvScore, cvScoreTimestamp, city, country, interests, preferredIndustries, etc.)
 * - Applications: applications collection, where userId == uid
 * - To-dos: actionItems collection, where userId == uid (used as canonical "todos" for Copilot)
 * - Opportunities: top matches via matching engine; saved from users/{uid}.savedOpportunitiesData
 * - Copilot history: users/{uid}/copilot_sessions
 */

import { db } from '../../../lib/firebase-admin';
import type { CareerContext, ApplicationSnapshot, TodoSnapshot, CopilotSummary, OpportunityMatch, ActivePathContext } from '@/types/copilot';
import { matchOpportunities } from '@/lib/opportunities-engine/matching-engine';
import type { UserProfileSnapshot } from '@/types/opportunities';
import { PATHS } from '@/lib/paths/catalog';
import { hydratePathProgress } from '@/lib/paths/progress';
import type { PathState } from '@/lib/paths/types';

const CV_SCORE_THRESHOLD_LOW = 50;
const RECENT_DAYS = 7;
const SUMMARY_LIMIT = 5;
const TOP_MATCHES_LIMIT = 10;

type TimestampLike = { toDate?: () => Date } | Date | string;

function toISO(d: TimestampLike | null | undefined): string | null {
  if (!d) return null;
  if (typeof d === 'string') return d;
  const t = d as { toDate?: () => Date };
  if (typeof t.toDate === 'function') return t.toDate().toISOString();
  if (d instanceof Date) return d.toISOString();
  return null;
}

export interface CareerContextOptions {
  /** Skip matchOpportunities() Firestore scan — saves ~200-300ms when caller doesn't need topMatches */
  skipOpportunityMatch?: boolean;
  /** Skip copilot_sessions subcollection read — saves ~80ms when caller doesn't need history */
  skipCopilotHistory?: boolean;
  /** Skip path_state subcollection read — saves ~80ms when caller reads path_state separately */
  skipActivePaths?: boolean;
}

export async function getCareerContext(uid: string, opts: CareerContextOptions = {}): Promise<CareerContext> {
  const context: CareerContext = {
    user: { uid, timezone: undefined },
    profile: null,
    cv: null,
    jobPreferences: null,
    opportunities: { topMatches: [], saved: [] },
    applications: { active: [], recent: [] },
    todos: { open: [], completedRecently: [] },
    history: { recentCopilotSummaries: [] },
    activePaths: [],
  };

  try {
    const userRef = db.collection('users').doc(uid);

    // Step 1: User doc first — profile, cv, saved opportunities all come from here
    const userSnap = await userRef.get();
    const userData = userSnap.exists ? userSnap.data() || {} : {};

    context.profile = userData as Record<string, unknown>;
    context.user.timezone = (userData as Record<string, unknown>).timezone as string | undefined;

    const plaintext = (userData as Record<string, unknown>).cvText as string | undefined;
    const score = (userData as Record<string, unknown>).cvScore as number | undefined;
    const ts = (userData as Record<string, unknown>).cvScoreTimestamp;
    if (plaintext != null && String(plaintext).trim() !== '') {
      context.cv = {
        id: 'default',
        uploadedAt: toISO(ts as TimestampLike | undefined),
        plaintext: String(plaintext).slice(0, 50000),
        score: typeof score === 'number' ? score : undefined,
      };
    }

    context.jobPreferences = {
      preferredIndustries: (userData as Record<string, unknown>).preferredIndustries,
      city: (userData as Record<string, unknown>).city,
      country: (userData as Record<string, unknown>).country,
      interests: (userData as Record<string, unknown>).interests,
    } as Record<string, unknown>;

    const savedData = (userData as Record<string, unknown>).savedOpportunitiesData as unknown[] | undefined;
    if (Array.isArray(savedData)) {
      context.opportunities.saved = savedData.slice(0, 50).map((o: unknown) => {
        const t = o as Record<string, unknown>;
        return {
          id: String(t.id ?? t.title ?? ''),
          title: String(t.title ?? ''),
          company: String(t.company ?? t.organization ?? ''),
          location: String(t.location ?? ''),
          url: String(t.url ?? ''),
          type: t.type as string | undefined,
          score: t.score as number | undefined,
          description: t.description as string | undefined,
        } as OpportunityMatch;
      });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - RECENT_DAYS);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();

    // Build profile snapshot for opportunity matching (derived from user doc above)
    const profileSnapshot: UserProfileSnapshot = {
      uid,
      university: (userData as Record<string, unknown>).university as string | undefined,
      degree: (userData as Record<string, unknown>).degree as string | undefined,
      interests: (userData as Record<string, unknown>).interests as string | undefined,
      preferredIndustries: (userData as Record<string, unknown>).preferredIndustries as string | undefined,
      bio: (userData as Record<string, unknown>).bio as string | undefined,
      city: (userData as Record<string, unknown>).city as string | undefined,
      country: (userData as Record<string, unknown>).country as string | undefined,
    };

    // Step 2: All remaining reads in parallel — independent of each other
    const [appResult, actionResult, sessionsResult, pathResult, matchResult] = await Promise.allSettled([
      db.collection('applications').where('userId', '==', uid).orderBy('createdAt', 'desc').limit(50).get(),
      db.collection('actionItems').where('userId', '==', uid).orderBy('createdAt', 'desc').limit(100).get(),
      opts.skipCopilotHistory
        ? Promise.resolve(null)
        : userRef.collection('copilot_sessions').orderBy('createdAt', 'desc').limit(SUMMARY_LIMIT).get(),
      opts.skipActivePaths
        ? Promise.resolve(null)
        : userRef.collection('path_state').get(),
      opts.skipOpportunityMatch
        ? Promise.resolve(null)
        : matchOpportunities({ userProfile: profileSnapshot, limit: TOP_MATCHES_LIMIT }),
    ]);

    // Applications
    if (appResult.status === 'fulfilled' && appResult.value) {
      const allApps: ApplicationSnapshot[] = [];
      appResult.value.forEach((doc) => {
        const d = doc.data();
        const createdAt = toISO(d.createdAt as TimestampLike) ?? String(d.createdAt ?? '');
        allApps.push({
          id: doc.id,
          company: String(d.company ?? ''),
          position: String(d.position ?? ''),
          stage: String(d.stage ?? ''),
          applyDate: String(d.applyDate ?? createdAt),
          jobUrl: d.jobUrl as string | undefined,
        });
      });
      context.applications.active = allApps.filter((a) => !['rejected', 'offered'].includes(a.stage));
      context.applications.recent = allApps.filter((a) => a.applyDate >= sevenDaysAgoISO);
    }

    // To-dos
    if (actionResult.status === 'fulfilled' && actionResult.value) {
      const allTodos: TodoSnapshot[] = [];
      actionResult.value.forEach((doc) => {
        const d = doc.data();
        const createdAt = toISO(d.createdAt as TimestampLike) ?? String(d.createdAt ?? '');
        allTodos.push({
          id: doc.id,
          title: String(d.title ?? ''),
          notes: d.notes as string | undefined,
          priority: String(d.priority ?? 'medium'),
          dueDate: d.dueDate as string | undefined,
          status: (d.completed ? 'completed' : 'open') as string,
          createdAt,
          source: d.source as string | undefined,
        });
      });
      context.todos.open = allTodos.filter((t) => t.status !== 'completed');
      context.todos.completedRecently = allTodos.filter((t) => t.status === 'completed' && t.createdAt >= sevenDaysAgoISO);
    }

    // Copilot history
    if (!opts.skipCopilotHistory && sessionsResult.status === 'fulfilled' && sessionsResult.value) {
      const summaries: CopilotSummary[] = [];
      sessionsResult.value.forEach((doc) => {
        const d = doc.data();
        summaries.push({
          sessionId: doc.id,
          createdAt: toISO(d.createdAt as TimestampLike) ?? '',
          userMessage: String(d.userMessage ?? ''),
          assistantSummary: String(d.assistantSummary ?? ''),
          priorities: d.priorities as string[] | undefined,
          todosSuggested: d.todosSuggested as number | undefined,
        });
      });
      context.history.recentCopilotSummaries = summaries;
    }

    // Active capability paths
    if (!opts.skipActivePaths && pathResult.status === 'fulfilled' && pathResult.value) {
      try {
        const stateMap = new Map<string, PathState>();
        pathResult.value.forEach((doc) => {
          const d = doc.data();
          const enrolledAt = toISO(d.enrolledAt as TimestampLike) ?? new Date().toISOString();
          stateMap.set(doc.id, {
            pathId: doc.id,
            enrolledAt,
            completedModuleIds: Array.isArray(d.completedModuleIds) ? d.completedModuleIds : [],
            currentModuleId: (d.currentModuleId as string) ?? null,
            pinned: Boolean(d.pinned),
            lastActivityAt: toISO(d.lastActivityAt as TimestampLike) ?? enrolledAt,
          });
        });
        if (stateMap.size > 0) {
          const enrolled: ActivePathContext[] = [];
          for (const path of PATHS) {
            const state = stateMap.get(path.id);
            if (!state) continue;
            const hydrated = hydratePathProgress(path, state);
            if (hydrated.progressPercent >= 100) continue;
            enrolled.push({
              pathId: path.id,
              pathTitle: path.title,
              outcome: path.outcome,
              progressPercent: hydrated.progressPercent,
              currentModuleTitle: hydrated.currentModule?.title ?? null,
            });
          }
          context.activePaths = enrolled;
        }
      } catch (pathErr) {
        console.error('[getCareerContext] activePaths failed', pathErr);
      }
    }

    // Opportunity top matches
    if (!opts.skipOpportunityMatch && matchResult.status === 'fulfilled' && matchResult.value) {
      context.opportunities.topMatches = (matchResult.value.opportunities || [])
        .slice(0, TOP_MATCHES_LIMIT)
        .map((o) => ({
          id: o.id,
          title: o.title,
          company: o.organization,
          location: o.location,
          url: o.url,
          type: o.type,
          score: o.score,
          description: o.description,
        })) as OpportunityMatch[];
    }

  } catch (e) {
    console.error('[getCareerContext]', e);
  }

  return context;
}

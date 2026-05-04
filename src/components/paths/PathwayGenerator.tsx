'use client';

/**
 * PathwayGenerator — the goal-based career pathway generator.
 *
 * Lifecycle:
 *   1. User picks a popular preset OR types a goal.
 *   2. Optional: target role, target industry.
 *   3. POST /api/paths/generate → returns a 5-horizon GeneratedPathway.
 *   4. Result rendered with HorizonTimeline. User can save (auto-saved server-side),
 *      open prior pathways, or generate a new one.
 *
 * States: empty, loading, error, saved-history, viewing-pathway.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import type { User } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2,
  Sparkles,
  Loader2,
  ArrowRight,
  Plus,
  History,
  Trash2,
  AlertCircle,
  Target,
  Briefcase,
  GraduationCap,
  TrendingUp,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createAuthFetcher, SWR_AUTH_CONFIG } from '@/lib/swr-fetcher';
import { trackEvent } from '@/lib/analytics';
import {
  HORIZON_ORDER,
  type GeneratedPathway,
  type HorizonKey,
  type PathwayStep,
} from '@/lib/paths/pathway-types';
import { HorizonTimeline } from './HorizonTimeline';

interface SavedResponse {
  pathways: GeneratedPathway[];
}

interface GenerateResponse {
  pathway: GeneratedPathway;
}

const PRESETS: { label: string; goal: string; role?: string; industry?: string; icon: React.ComponentType<{ className?: string }> }[] = [
  {
    label: 'Strategy consulting',
    goal: 'Land a strategy consulting role at a top firm',
    role: 'Strategy Consultant',
    industry: 'Consulting',
    icon: Target,
  },
  {
    label: 'Product manager',
    goal: 'Become a product manager at a tech company',
    role: 'Product Manager',
    industry: 'Tech',
    icon: TrendingUp,
  },
  {
    label: 'Software engineer',
    goal: 'Get a graduate software engineering job',
    role: 'Software Engineer',
    industry: 'Tech',
    icon: Briefcase,
  },
  {
    label: 'Investment banking',
    goal: 'Break into investment banking',
    role: 'Investment Banking Analyst',
    industry: 'Finance',
    icon: TrendingUp,
  },
  {
    label: 'Data scientist',
    goal: 'Move into a data science role',
    role: 'Data Scientist',
    industry: 'Tech',
    icon: GraduationCap,
  },
];

function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function horizonOffsetDays(key: HorizonKey): number {
  switch (key) {
    case 'now':
      return 0;
    case '30d':
      return 7;
    case '3mo':
      return 30;
    case '6mo':
      return 90;
    case '12mo':
      return 180;
  }
}

function addDaysISO(yyyyMmDd: string, days: number): string {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() + days);
  const yy = base.getUTCFullYear();
  const mm = String(base.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(base.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

interface Props {
  user: User;
}

export function PathwayGenerator({ user }: Props) {
  const userRef = useRef(user);
  userRef.current = user;

  const safeGetToken = useCallback(async (): Promise<string | null> => {
    try {
      const u = userRef.current;
      if (!u) return null;
      return await u.getIdToken();
    } catch (e) {
      console.error('[pathway] getIdToken failed', e);
      return null;
    }
  }, []);

  const fetcher = useMemo(() => createAuthFetcher(user), [user]);
  const { data: savedData, mutate: mutateSaved } = useSWR<SavedResponse>(
    '/api/paths/saved',
    fetcher,
    SWR_AUTH_CONFIG
  );
  const savedPathways = savedData?.pathways ?? [];

  const [goal, setGoal] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [targetIndustry, setTargetIndustry] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePathway, setActivePathway] = useState<GeneratedPathway | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [pendingStepId, setPendingStepId] = useState<string | null>(null);
  const [scheduledStepIds, setScheduledStepIds] = useState<Set<string>>(new Set());

  const handleGenerate = useCallback(async () => {
    setError(null);
    if (goal.trim().length < 5) {
      setError('Tell us a little more about your goal so we can build a useful pathway.');
      return;
    }
    setGenerating(true);
    try {
      const token = await safeGetToken();
      if (!token) {
        setError('You need to be signed in.');
        return;
      }
      const res = await fetch('/api/paths/generate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: goal.trim(),
          targetRole: targetRole.trim() || undefined,
          targetIndustry: targetIndustry.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const errPayload = await res.json().catch(() => ({}));
        setError(errPayload.error ?? 'Could not generate your pathway. Try again.');
        return;
      }
      const data = (await res.json()) as GenerateResponse;
      setActivePathway(data.pathway);
      setScheduledStepIds(new Set());
      const uid = userRef.current?.uid;
      if (uid) trackEvent('pathway_generated', uid, { goal: goal.trim().slice(0, 80) });
      await mutateSaved();
    } catch (e) {
      console.error('[pathway] generate failed', e);
      setError('Could not reach the pathway service. Check your connection and try again.');
    } finally {
      setGenerating(false);
    }
  }, [goal, targetRole, targetIndustry, safeGetToken, mutateSaved]);

  const handlePreset = useCallback((p: (typeof PRESETS)[number]) => {
    setGoal(p.goal);
    setTargetRole(p.role ?? '');
    setTargetIndustry(p.industry ?? '');
  }, []);

  const openSaved = useCallback(
    async (pathway: GeneratedPathway) => {
      setActivePathway(pathway);
      setScheduledStepIds(new Set());
      setShowHistory(false);
      const uid = userRef.current?.uid;
      if (uid) trackEvent('pathway_opened', uid, { pathwayId: pathway.id });
      try {
        const token = await safeGetToken();
        if (!token) return;
        await fetch(`/api/paths/saved/${pathway.id}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        });
        mutateSaved();
      } catch (e) {
        console.error('[pathway] bump lastViewedAt failed', e);
      }
    },
    [safeGetToken, mutateSaved]
  );

  const deleteSaved = useCallback(
    async (pathwayId: string) => {
      try {
        const token = await safeGetToken();
        if (!token) return;
        await fetch(`/api/paths/saved/${pathwayId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        const uid = userRef.current?.uid;
        if (uid) trackEvent('pathway_deleted', uid, { pathwayId });
        if (activePathway?.id === pathwayId) setActivePathway(null);
        mutateSaved();
      } catch (e) {
        console.error('[pathway] delete failed', e);
      }
    },
    [safeGetToken, activePathway, mutateSaved]
  );

  const sendStepToPlanner = useCallback(
    async (step: PathwayStep, horizon: HorizonKey) => {
      setPendingStepId(step.id);
      try {
        const token = await safeGetToken();
        if (!token) return;
        const date = addDaysISO(localDateKey(), horizonOffsetDays(horizon));
        const res = await fetch('/api/planner/events', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date,
            title: step.title,
            notes: step.rationale,
            source: 'copilot',
          }),
        });
        if (res.ok) {
          setScheduledStepIds((prev) => new Set(prev).add(step.id));
          const uid = userRef.current?.uid;
          if (uid) trackEvent('pathway_step_to_planner', uid, { stepId: step.id, horizon });
        }
      } catch (e) {
        console.error('[pathway] send step failed', e);
      } finally {
        setPendingStepId(null);
      }
    },
    [safeGetToken]
  );

  const reset = useCallback(() => {
    setActivePathway(null);
    setError(null);
  }, []);

  return (
    <Card className="border-[var(--accent-blue)]/15 bg-gradient-to-br from-[var(--surface-card)] to-[var(--accent-blue-soft)]/40">
      <CardContent className="p-5 sm:p-7">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="rounded-xl bg-[var(--accent-blue)]/15 p-2.5 shrink-0">
              <Wand2 className="h-5 w-5 text-[var(--accent-blue)]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold leading-tight">Build your pathway</h2>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
                Describe a goal — we&apos;ll map it to a 12-month roadmap.
              </p>
            </div>
          </div>
          {savedPathways.length > 0 && (
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--surface-subtle)] transition-colors shrink-0"
            >
              <History className="h-3 w-3" />
              <span className="hidden sm:inline">History</span>
              <span className="rounded-full bg-[var(--accent-blue-soft)] px-1.5 text-[10px] text-[var(--accent-blue)]">
                {savedPathways.length}
              </span>
            </button>
          )}
        </div>

        {/* History drawer */}
        <AnimatePresence>
          {showHistory && savedPathways.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mb-5"
            >
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)]">
                    Your saved pathways
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowHistory(false)}
                    className="text-[var(--text-subtle)] hover:text-[var(--foreground)]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  {savedPathways.map((p) => (
                    <SavedPathwayRow
                      key={p.id}
                      pathway={p}
                      isActive={activePathway?.id === p.id}
                      onOpen={() => openSaved(p)}
                      onDelete={() => deleteSaved(p.id)}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input form (only when no pathway is active) */}
        {!activePathway && (
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-subtle)] block mb-1.5">
                Your goal
              </label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. I want to land a strategy consulting internship at MBB by next summer."
                rows={2}
                disabled={generating}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/40 focus:border-[var(--accent-blue)] disabled:opacity-60 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-subtle)] block mb-1.5">
                  Target role <span className="text-[var(--text-subtle)] font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Strategy Consultant"
                  disabled={generating}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/40 focus:border-[var(--accent-blue)] disabled:opacity-60"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-subtle)] block mb-1.5">
                  Industry <span className="text-[var(--text-subtle)] font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={targetIndustry}
                  onChange={(e) => setTargetIndustry(e.target.value)}
                  placeholder="e.g. Consulting"
                  disabled={generating}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/40 focus:border-[var(--accent-blue)] disabled:opacity-60"
                />
              </div>
            </div>

            {/* Presets */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-subtle)] mb-2">
                Quick starts
              </p>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handlePreset(p)}
                    disabled={generating}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--foreground)] hover:bg-[var(--surface-subtle)] hover:border-[var(--accent-blue)]/40 transition-colors disabled:opacity-60"
                  >
                    <p.icon className="h-3 w-3 text-[var(--accent-blue)]" />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-[var(--danger-soft)] bg-[var(--danger-soft)]/40 px-3 py-2">
                <AlertCircle className="h-4 w-4 text-[var(--danger)] mt-0.5 shrink-0" />
                <p className="text-xs text-[var(--danger)]">{error}</p>
              </div>
            )}

            {/* CTA */}
            <Button onClick={handleGenerate} disabled={generating} size="lg" className="w-full sm:w-auto">
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Designing your pathway...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate pathway
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Result */}
        {activePathway && !generating && (
          <div className="space-y-5">
            <HorizonTimeline
              pathway={activePathway}
              onSendStepToPlanner={sendStepToPlanner}
              pendingStepId={pendingStepId}
              scheduledStepIds={scheduledStepIds}
            />
            <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--border-soft)]">
              <Button onClick={reset} variant="outline" size="sm">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                New pathway
              </Button>
              <Button
                onClick={() => deleteSaved(activePathway.id)}
                variant="ghost"
                size="sm"
                className="text-[var(--danger)] hover:text-[var(--danger)]"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Delete pathway
              </Button>
            </div>
          </div>
        )}

        {/* Generating skeleton */}
        {generating && !activePathway && <GeneratingSkeleton />}
      </CardContent>
    </Card>
  );
}

function SavedPathwayRow({
  pathway,
  isActive,
  onOpen,
  onDelete,
}: {
  pathway: GeneratedPathway;
  isActive: boolean;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const totalSteps = pathway.horizons.reduce((acc, h) => acc + h.steps.length, 0);
  const created = new Date(pathway.createdAt);
  const dateLabel = created.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-2.5 py-2 border transition-colors ${
        isActive
          ? 'border-[var(--accent-blue)]/30 bg-[var(--accent-blue-soft)]/30'
          : 'border-transparent hover:bg-[var(--surface-subtle)]'
      }`}
    >
      <button type="button" onClick={onOpen} className="flex-1 min-w-0 text-left">
        <p className="text-sm font-medium truncate">{pathway.title}</p>
        <p className="text-[11px] text-[var(--text-subtle)] truncate">
          {totalSteps} steps · {dateLabel}
        </p>
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="p-1.5 rounded-md text-[var(--text-subtle)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)]/40 transition-colors shrink-0"
        title="Delete pathway"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

function GeneratingSkeleton() {
  return (
    <div className="space-y-4 mt-2">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-card)] p-5">
        <div className="flex items-center gap-2 mb-2">
          <Loader2 className="h-4 w-4 text-[var(--accent-blue)] animate-spin" />
          <p className="text-sm font-medium text-[var(--foreground)]">
            Designing your 12-month pathway...
          </p>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Mapping skills, projects, learning, experience, and opportunities across 5 horizons.
        </p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {HORIZON_ORDER.map((k) => (
          <div
            key={k}
            className="h-32 rounded-xl border border-[var(--border)] bg-[var(--surface-card)] animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

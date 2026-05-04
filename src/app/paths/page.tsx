'use client';

/**
 * Capability Paths — premium upskilling page.
 *
 * Performance strategy:
 *   1. Static catalog (PATHS) is imported and rendered IMMEDIATELY on first
 *      paint — no waiting on the network. Filter chips + browse grid are
 *      visible the moment the page mounts.
 *   2. /api/paths is fetched in parallel for state (enrolled, progress,
 *      active path). Hydrates the cards once it arrives — usually <100ms.
 *   3. /api/paths/recommendations is fetched in parallel for personalised
 *      picks. Renders skeletons until ready, then slides in.
 *
 * Layout:
 *   - Header with intro
 *   - Pathway Generator
 *   - Active Path spotlight (hydrated when state arrives)
 *   - Recommended For You (top 3 with reasons)
 *   - Browse all paths grid (filterable by category) — visible instantly
 */

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import useSWR from 'swr';
import { createAuthFetcher, SWR_AUTH_CONFIG } from '@/lib/swr-fetcher';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Loader2,
  Target,
  Clock,
  TrendingUp,
  Pin,
  PinOff,
  CalendarPlus,
  BookOpen,
  X,
  Brain,
  Lightbulb,
  Compass,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { trackEvent } from '@/lib/analytics';
import type {
  PathProgress,
  PathRecommendation,
  PathCategory,
  Path,
  PathModule,
} from '@/lib/paths/types';
import { PATHS } from '@/lib/paths/catalog';
import { hydratePathProgress, pickActivePath } from '@/lib/paths/progress';
import { PathwayGenerator } from '@/components/paths/PathwayGenerator';
import { ModuleViewer } from '@/components/paths/ModuleViewer';

interface PathsResponse {
  paths: PathProgress[];
  activePath: PathProgress | null;
}

interface RecommendationsResponse {
  recommendations: PathRecommendation[];
}

const CATEGORY_LABEL: Record<PathCategory, string> = {
  'ai-fluency': 'AI Fluency',
  technical: 'Technical',
  'job-search': 'Job Search',
  communication: 'Communication',
  productivity: 'Productivity',
};

const CATEGORY_ICON: Record<PathCategory, React.ComponentType<{ className?: string }>> = {
  'ai-fluency': Sparkles,
  technical: BookOpen,
  'job-search': Target,
  communication: Brain,
  productivity: TrendingUp,
};

// Placeholder progress for first-paint render — every catalog path looks "not
// enrolled" until /api/paths resolves, at which point real state replaces this.
const EMPTY_PROGRESSES: PathProgress[] = PATHS.map((path) => hydratePathProgress(path, null));

function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/* ─── Progress Ring ─── */

function ProgressRing({ percent, size = 56 }: { percent: number; size?: number }) {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="var(--border-soft)"
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="var(--accent-blue)"
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="fill-[var(--foreground)] font-semibold"
        style={{ fontSize: size * 0.28 }}
      >
        {percent}%
      </text>
    </svg>
  );
}

/* ─── Page ─── */

export default function PathsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [actionPending, setActionPending] = useState<string | null>(null);
  const [filter, setFilter] = useState<PathCategory | 'all'>('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [viewerState, setViewerState] = useState<{
    path: Path;
    module: PathModule;
    moduleIndex: number;
  } | null>(null);

  // Stable ref-based token getter — isolates Firebase IndexedDB rejections
  // (which can be raw DOM Event objects, not Errors).
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const safeGetToken = useCallback(async (): Promise<string | null> => {
    try {
      const u = userRef.current;
      if (!u) return null;
      return await u.getIdToken();
    } catch (e) {
      console.error('[paths] getIdToken failed', e);
      return null;
    }
  }, []);

  // SWR fetcher memoized on user
  const pathsFetcher = useMemo(() => (user ? createAuthFetcher(user) : null), [user]);

  // State endpoint — fast, no career-context aggregation
  const { data: stateData, mutate: mutatePaths } = useSWR<PathsResponse>(
    user ? '/api/paths' : null,
    pathsFetcher,
    SWR_AUTH_CONFIG
  );

  // Recommendations endpoint — slower, runs career-context lite + scoring.
  // Wait for state to arrive before fetching so the exclude list is correct
  // and we don't show recs the user is already enrolled in (would just flicker).
  const enrolledIds = useMemo(
    () =>
      (stateData?.paths ?? [])
        .filter((p) => p.isEnrolled)
        .map((p) => p.path.id)
        .sort()
        .join(','),
    [stateData]
  );
  const recsKey = user && stateData ? `/api/paths/recommendations?exclude=${enrolledIds}` : null;
  const { data: recsData, isLoading: recsLoading } = useSWR<RecommendationsResponse>(
    recsKey,
    pathsFetcher,
    SWR_AUTH_CONFIG
  );

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  const enroll = useCallback(
    async (pathId: string, addToPlanner: boolean): Promise<boolean> => {
      setActionPending(`enroll:${pathId}`);
      setErrorMsg(null);
      try {
        const token = await safeGetToken();
        if (!token) {
          setErrorMsg('Could not verify your session. Please sign in again.');
          return false;
        }
        const res = await fetch('/api/paths/enroll', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ pathId, addToPlanner, startDateISO: localDateKey() }),
        });
        if (!res.ok) {
          setErrorMsg('Could not start that path. Please try again.');
          return false;
        }
        const uid = userRef.current?.uid;
        if (uid) trackEvent('path_enrolled', uid, { pathId, addToPlanner });
        await mutatePaths();
        router.refresh();
        return true;
      } catch (e) {
        console.error('[paths] enroll failed', e);
        setErrorMsg('Could not start that path. Please try again.');
        return false;
      } finally {
        setActionPending(null);
      }
    },
    [safeGetToken, mutatePaths, router]
  );

  const completeModule = useCallback(
    async (pathId: string, moduleId: string) => {
      setActionPending(`complete:${moduleId}`);
      try {
        const token = await safeGetToken();
        if (!token) return;
        const res = await fetch('/api/paths/complete-module', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ pathId, moduleId }),
        });
        if (res.ok) {
          const uid = userRef.current?.uid;
          if (uid) trackEvent('path_module_completed', uid, { pathId, moduleId });
          await mutatePaths();
          router.refresh();
        }
      } catch (e) {
        console.error('[paths] completeModule failed', e);
      } finally {
        setActionPending(null);
      }
    },
    [safeGetToken, mutatePaths, router]
  );

  const togglePin = useCallback(
    async (pathId: string, pinned: boolean) => {
      setActionPending(`pin:${pathId}`);
      try {
        const token = await safeGetToken();
        if (!token) return;
        await fetch('/api/paths/pin', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ pathId, pinned }),
        });
        const uid = userRef.current?.uid;
        if (uid) trackEvent('path_pinned', uid, { pathId, pinned });
        await mutatePaths();
      } catch (e) {
        console.error('[paths] togglePin failed', e);
      } finally {
        setActionPending(null);
      }
    },
    [safeGetToken, mutatePaths]
  );

  const openModule = useCallback((path: Path, module: PathModule) => {
    const idx = path.modules.findIndex((m) => m.id === module.id);
    setViewerState({ path, module, moduleIndex: idx >= 0 ? idx : 0 });
  }, []);

  const closeModule = useCallback(() => setViewerState(null), []);

  /** Start a path then drop the user straight into the first module. */
  const startPathAndOpen = useCallback(
    async (path: Path, addToPlanner: boolean) => {
      const ok = await enroll(path.id, addToPlanner);
      if (ok && path.modules[0]) openModule(path, path.modules[0]);
    },
    [enroll, openModule]
  );

  /** Switch the active path and drop user into their current module immediately.
   *  Pin update fires in the background — UI shouldn't block on it. */
  const switchToPath = useCallback(
    (progress: PathProgress) => {
      void togglePin(progress.path.id, true);
      const target = progress.currentModule ?? progress.path.modules[0];
      if (target) openModule(progress.path, target);
    },
    [togglePin, openModule]
  );

  const unenroll = useCallback(
    async (pathId: string) => {
      if (!window.confirm('Remove this path from your active list? Your planner tasks stay.')) return;
      setActionPending(`unenroll:${pathId}`);
      try {
        const token = await safeGetToken();
        if (!token) return;
        await fetch('/api/paths/unenroll', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ pathId }),
        });
        const uid = userRef.current?.uid;
        if (uid) trackEvent('path_unenrolled', uid, { pathId });
        await mutatePaths();
      } catch (e) {
        console.error('[paths] unenroll failed', e);
      } finally {
        setActionPending(null);
      }
    },
    [safeGetToken, mutatePaths]
  );

  // Show server data when ready, otherwise fall back to empty-state catalog
  const allPaths = useMemo(() => stateData?.paths ?? EMPTY_PROGRESSES, [stateData]);
  const enrolledPaths = useMemo(() => allPaths.filter((p) => p.isEnrolled), [allPaths]);
  const otherPaths = useMemo(() => allPaths.filter((p) => !p.isEnrolled), [allPaths]);
  const filteredOther = useMemo(
    () => (filter === 'all' ? otherPaths : otherPaths.filter((p) => p.path.category === filter)),
    [otherPaths, filter]
  );
  const activePath = stateData?.activePath ?? null;
  const recommendations = recsData?.recommendations ?? [];

  // Only block on auth, not on data — render the catalog while data loads
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-[var(--accent-blue)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="page-container">
        {/* ─── Header ─── */}
        <motion.div
          className="page-header"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-xl bg-[var(--accent-blue-soft)] p-2.5">
              <GraduationCap className="h-5 w-5 text-[var(--accent-blue)]" />
            </div>
            <h1 className="page-title">Paths</h1>
          </div>
          <p className="page-subtitle max-w-2xl">
            Map your goal to a 12-month roadmap, then deepen with focused capability paths.
          </p>
        </motion.div>

        {errorMsg && (
          <motion.div
            className="mb-6 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-4 py-3 flex items-start justify-between gap-3"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-sm text-[var(--danger)]">{errorMsg}</p>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-[var(--danger)] hover:opacity-70 shrink-0"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {/* ─── Pathway Generator ─── */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.03 }}
        >
          <PathwayGenerator user={user} />
        </motion.div>

        {/* ─── Capability Paths divider ─── */}
        <motion.div
          className="mb-6 flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <div className="h-px flex-1 bg-[var(--border-soft)]" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)]">
            Capability paths · short focused courses
          </p>
          <div className="h-px flex-1 bg-[var(--border-soft)]" />
        </motion.div>

        {/* ─── Active Path Spotlight ─── */}
        {activePath && (
          <motion.div
            className="mb-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <ActivePathSpotlight
              progress={activePath}
              onCompleteModule={(mid) => completeModule(activePath.path.id, mid)}
              onTogglePin={() => togglePin(activePath.path.id, !activePath.state?.pinned)}
              onUnenroll={() => unenroll(activePath.path.id)}
              onOpenModule={(m) => openModule(activePath.path, m)}
              actionPending={actionPending}
            />
          </motion.div>
        )}

        {/* ─── Other Enrolled Paths ─── */}
        {enrolledPaths.length > (activePath ? 1 : 0) && (
          <motion.div
            className="mb-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <SectionHeader icon={Compass} title="Your other paths" />
            <div className="grid sm:grid-cols-2 gap-3">
              {enrolledPaths
                .filter((p) => p.path.id !== activePath?.path.id)
                .map((p) => (
                  <EnrolledMiniCard
                    key={p.path.id}
                    progress={p}
                    onResume={() => switchToPath(p)}
                    actionPending={actionPending}
                  />
                ))}
            </div>
          </motion.div>
        )}

        {/* ─── Recommended For You ─── */}
        {(recommendations.length > 0 || recsLoading) && (
          <motion.div
            className="mb-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <SectionHeader
              icon={Lightbulb}
              title="Recommended for you"
              subtitle="Selected from your profile, interests, and current career signals"
            />
            <div className="grid md:grid-cols-3 gap-4">
              {recsLoading && recommendations.length === 0
                ? Array.from({ length: 3 }).map((_, i) => <RecommendationSkeleton key={i} />)
                : recommendations.map((rec) => (
                    <RecommendationCard
                      key={rec.path.id}
                      rec={rec}
                      onStart={(addToPlanner) => startPathAndOpen(rec.path, addToPlanner)}
                      actionPending={actionPending}
                    />
                  ))}
            </div>
          </motion.div>
        )}

        {/* ─── Browse All ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <SectionHeader icon={BookOpen} title="Browse all paths" />
          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-5">
            <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label="All" />
            {(Object.keys(CATEGORY_LABEL) as PathCategory[]).map((cat) => (
              <FilterChip
                key={cat}
                active={filter === cat}
                onClick={() => setFilter(cat)}
                label={CATEGORY_LABEL[cat]}
              />
            ))}
          </div>

          {filteredOther.length === 0 ? (
            <div className="empty-state py-10">
              <BookOpen className="empty-state-icon" />
              <p className="font-medium">No paths in this category</p>
              <p className="text-sm text-[var(--text-subtle)]">Try a different filter</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOther.map((p) => (
                <BrowsePathCard
                  key={p.path.id}
                  progress={p}
                  onStart={(addToPlanner) => startPathAndOpen(p.path, addToPlanner)}
                  onPreview={() => openModule(p.path, p.path.modules[0])}
                  actionPending={actionPending}
                />
              ))}
            </div>
          )}

          {/* ─── More pathways in development notice ─── */}
          <motion.div
            className="mt-8 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-subtle)]/40 px-5 py-4 flex items-start gap-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <div className="rounded-lg bg-[var(--accent-blue-soft)] p-2 shrink-0">
              <Sparkles className="h-4 w-4 text-[var(--accent-blue)]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--foreground)] mb-0.5">
                More pathways &amp; richer interactive lessons coming soon
              </p>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                We&apos;re actively building out new capability paths and deeper
                hands-on modules — including practice playgrounds, AI-assisted
                feedback, and roles tailored by industry. Tell us what you&apos;d
                like to learn next via the{' '}
                <button
                  type="button"
                  onClick={() => router.push('/copilot')}
                  className="text-[var(--accent-blue)] hover:underline font-medium"
                >
                  Copilot
                </button>
                .
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {viewerState && (
        <ModuleViewer
          path={viewerState.path}
          module={viewerState.module}
          moduleIndex={viewerState.moduleIndex}
          completedModuleIds={
            allPaths.find((p) => p.path.id === viewerState.path.id)?.state?.completedModuleIds ?? []
          }
          onClose={closeModule}
          onComplete={async () => {
            await completeModule(viewerState.path.id, viewerState.module.id);
            closeModule();
          }}
          isCompleting={actionPending === `complete:${viewerState.module.id}`}
        />
      )}
    </div>
  );
}

/* ─── Section Header ─── */

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-[var(--accent-blue)]" />
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {subtitle && <p className="text-sm text-[var(--text-muted)]">{subtitle}</p>}
    </div>
  );
}

/* ─── Filter chip ─── */

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors border ${
        active
          ? 'bg-[var(--accent-blue)] text-white border-[var(--accent-blue)]'
          : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--surface-subtle)]'
      }`}
    >
      {label}
    </button>
  );
}

/* ─── Recommendation skeleton ─── */

function RecommendationSkeleton() {
  return (
    <Card className="h-full">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-lg bg-[var(--surface-subtle)] animate-pulse" />
          <div className="h-3 w-20 rounded bg-[var(--surface-subtle)] animate-pulse" />
        </div>
        <div className="h-4 w-3/4 rounded bg-[var(--surface-subtle)] animate-pulse mb-2" />
        <div className="h-3 w-full rounded bg-[var(--surface-subtle)] animate-pulse mb-4" />
        <div className="space-y-2 mb-4">
          <div className="h-3 w-5/6 rounded bg-[var(--surface-subtle)] animate-pulse" />
          <div className="h-3 w-4/6 rounded bg-[var(--surface-subtle)] animate-pulse" />
        </div>
        <div className="h-9 w-full rounded bg-[var(--surface-subtle)] animate-pulse" />
      </CardContent>
    </Card>
  );
}

/* ─── Active Path Spotlight ─── */

function ActivePathSpotlight({
  progress,
  onCompleteModule,
  onTogglePin,
  onUnenroll,
  onOpenModule,
  actionPending,
}: {
  progress: PathProgress;
  onCompleteModule: (moduleId: string) => void;
  onTogglePin: () => void;
  onUnenroll: () => void;
  onOpenModule: (module: PathModule) => void;
  actionPending: string | null;
}) {
  const { path, currentModule, progressPercent, completedCount, totalCount, state } = progress;
  const isPinned = state?.pinned ?? false;

  if (!currentModule) {
    // Path complete
    return (
      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="rounded-xl bg-[var(--success-soft)] p-3">
              <CheckCircle2 className="h-6 w-6 text-[var(--success)]" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--success)] mb-0.5">
                Path complete
              </p>
              <h3 className="text-xl font-bold">{path.title}</h3>
            </div>
          </div>
          <p className="text-sm text-[var(--text-muted)] mb-4">{path.outcome}</p>
          <Button variant="outline" size="sm" onClick={onUnenroll}>
            <X className="h-3.5 w-3.5 mr-1.5" /> Remove from active
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[var(--accent-blue)]/20">
      <CardContent className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-4 min-w-0">
            <ProgressRing percent={progressPercent} size={64} />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-blue)] mb-1">
                Currently learning
              </p>
              <h3 className="text-xl sm:text-2xl font-bold truncate">{path.title}</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Module {completedCount + 1} of {totalCount} · {path.estimatedMinutes} min total
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onTogglePin}
              className="p-2 rounded-lg hover:bg-[var(--surface-subtle)] transition-colors"
              title={isPinned ? 'Unpin' : 'Pin to dashboard'}
              disabled={actionPending === `pin:${path.id}`}
            >
              {isPinned ? (
                <Pin className="h-4 w-4 text-[var(--accent-blue)]" />
              ) : (
                <PinOff className="h-4 w-4 text-[var(--text-subtle)]" />
              )}
            </button>
            <button
              type="button"
              onClick={onUnenroll}
              className="p-2 rounded-lg hover:bg-[var(--surface-subtle)] transition-colors"
              title="Remove from active"
            >
              <X className="h-4 w-4 text-[var(--text-subtle)]" />
            </button>
          </div>
        </div>

        {/* Outcome chip */}
        <div className="rounded-lg border border-[var(--accent-blue)]/15 bg-[var(--accent-blue-soft)]/40 px-4 py-3 mb-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-blue)] mb-1">
            What this improves
          </p>
          <p className="text-sm text-[var(--foreground)]">{path.outcome}</p>
        </div>

        {/* Current module spotlight */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)]">
              Next module
            </span>
            <span className="text-[10px] text-[var(--text-subtle)]">·</span>
            <span className="text-[10px] text-[var(--text-subtle)] flex items-center gap-1">
              <Clock className="h-3 w-3" /> {currentModule.estimatedMinutes} min
            </span>
          </div>
          <h4 className="text-base font-semibold mb-2">{currentModule.title}</h4>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-4">
            {currentModule.concept}
          </p>

          <div className="space-y-3 mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)] mb-1">
                Practical action
              </p>
              <p className="text-sm">{currentModule.practicalAction}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)] mb-1">
                Mini task
              </p>
              <p className="text-sm">{currentModule.miniTask}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => onOpenModule(currentModule)}
              size="sm"
              className="w-full sm:w-auto"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Open lesson
            </Button>
            <Button
              onClick={() => onCompleteModule(currentModule.id)}
              disabled={actionPending === `complete:${currentModule.id}`}
              size="sm"
              variant="outline"
              className="w-full sm:w-auto"
            >
              {actionPending === `complete:${currentModule.id}` ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Mark complete
            </Button>
          </div>
        </div>

        {/* Module list */}
        <div className="mt-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)] mb-2">
            All modules
          </p>
          <div className="space-y-1">
            {path.modules.map((m, i) => {
              const isComplete = state?.completedModuleIds?.includes(m.id) ?? false;
              const isCurrent = m.id === currentModule.id;
              return (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => onOpenModule(m)}
                  className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors hover:bg-[var(--surface-subtle)] ${
                    isCurrent ? 'bg-[var(--accent-blue-soft)]/50' : ''
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4 text-[var(--success)] shrink-0" />
                  ) : (
                    <div
                      className={`h-4 w-4 rounded-full border shrink-0 ${
                        isCurrent
                          ? 'border-[var(--accent-blue)] bg-[var(--accent-blue)]/20'
                          : 'border-[var(--border)]'
                      }`}
                    />
                  )}
                  <span
                    className={`text-xs flex-1 truncate ${
                      isComplete
                        ? 'text-[var(--text-subtle)] line-through'
                        : isCurrent
                          ? 'text-[var(--foreground)] font-medium'
                          : 'text-[var(--text-muted)]'
                    }`}
                  >
                    {i + 1}. {m.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Recommendation card ─── */

function RecommendationCard({
  rec,
  onStart,
  actionPending,
}: {
  rec: PathRecommendation;
  onStart: (addToPlanner: boolean) => void;
  actionPending: string | null;
}) {
  const Icon = CATEGORY_ICON[rec.path.category];
  const isPending = actionPending === `enroll:${rec.path.id}`;
  return (
    <Card className="hover-lift h-full flex flex-col">
      <CardContent className="p-5 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-3">
          <div className="rounded-lg bg-[var(--accent-blue-soft)] p-2">
            <Icon className="h-4 w-4 text-[var(--accent-blue)]" />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-subtle)]">
            {CATEGORY_LABEL[rec.path.category]}
          </span>
        </div>
        <h3 className="text-base font-semibold mb-1">{rec.path.title}</h3>
        <p className="text-xs text-[var(--text-muted)] mb-3">{rec.path.tagline}</p>

        <div className="space-y-1.5 mb-4 flex-1">
          {rec.reasons.map((r, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <Lightbulb className="h-3 w-3 text-[var(--accent-blue)] mt-0.5 shrink-0" />
              <p className="text-xs text-[var(--text-muted)]">{r}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-[var(--text-subtle)] mb-3">
          <span>{rec.path.modules.length} modules</span>
          <span>{rec.path.estimatedMinutes} min</span>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onStart(false)}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Start'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onStart(true)}
            disabled={isPending}
            title="Start and add the first 3 modules to your planner"
          >
            <CalendarPlus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Browse path card ─── */

function BrowsePathCard({
  progress,
  onStart,
  onPreview,
  actionPending,
}: {
  progress: PathProgress;
  onStart: (addToPlanner: boolean) => void;
  onPreview: () => void;
  actionPending: string | null;
}) {
  const { path } = progress;
  const Icon = CATEGORY_ICON[path.category];
  const isPending = actionPending === `enroll:${path.id}`;
  return (
    <Card className="hover-lift h-full flex flex-col">
      <CardContent className="p-5 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-3">
          <div className="rounded-lg bg-[var(--surface-subtle)] p-2">
            <Icon className="h-4 w-4 text-[var(--text-muted)]" />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-subtle)]">
            {CATEGORY_LABEL[path.category]}
          </span>
        </div>
        <h3 className="text-base font-semibold mb-1">{path.title}</h3>
        <p className="text-xs text-[var(--text-muted)] mb-3 flex-1">{path.tagline}</p>
        <p className="text-xs text-[var(--text-subtle)] mb-3">{path.outcome}</p>

        <div className="flex items-center justify-between text-xs text-[var(--text-subtle)] mb-3">
          <span>{path.modules.length} modules</span>
          <span>{path.estimatedMinutes} min</span>
        </div>

        <div className="flex gap-2 mb-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onStart(false)}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Start path'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onStart(true)}
            disabled={isPending}
            title="Start and add the first 3 modules to your planner"
          >
            <CalendarPlus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <button
          type="button"
          onClick={onPreview}
          className="text-[11px] text-[var(--accent-blue)] hover:underline self-start font-medium"
        >
          Preview first lesson →
        </button>
      </CardContent>
    </Card>
  );
}

/* ─── Mini card for other enrolled paths ─── */

function EnrolledMiniCard({
  progress,
  onResume,
  actionPending,
}: {
  progress: PathProgress;
  onResume: () => void;
  actionPending: string | null;
}) {
  const { path, currentModule, progressPercent } = progress;
  const isPending = actionPending === `pin:${path.id}`;
  return (
    <button
      type="button"
      onClick={onResume}
      disabled={isPending}
      className="w-full text-left"
    >
      <Card className="hover-lift transition-all cursor-pointer hover:border-[var(--accent-blue)]/40">
        <CardContent className="p-4 flex items-center gap-4">
          <ProgressRing percent={progressPercent} size={48} />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold truncate">{path.title}</h4>
            <p className="text-xs text-[var(--text-muted)] truncate">
              {currentModule ? `Next: ${currentModule.title}` : 'All modules complete'}
            </p>
          </div>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin text-[var(--accent-blue)] shrink-0" />
          ) : (
            <span className="text-xs text-[var(--accent-blue)] shrink-0 font-medium">Resume →</span>
          )}
        </CardContent>
      </Card>
    </button>
  );
}

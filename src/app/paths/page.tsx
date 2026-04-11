'use client';

/**
 * Capability Paths — premium upskilling page.
 *
 * Layout:
 *   - Header with intro
 *   - Active Path spotlight (current module concept + mini task + mark complete)
 *   - Recommended For You (top 3 with reasons)
 *   - Browse all paths grid (filterable by category)
 *
 * Design philosophy: Apple clarity + Claude calm. Heavy use of CSS variables.
 * No LMS clutter — every section answers "why am I learning this?".
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  GraduationCap,
  Sparkles,
  CheckCircle2,
  ArrowRight,
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
import type { Path, PathProgress, PathRecommendation, PathCategory } from '@/lib/paths/types';

interface PathsResponse {
  paths: PathProgress[];
  activePath: PathProgress | null;
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
  const { user } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<PathsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [filter, setFilter] = useState<PathCategory | 'all'>('all');

  const fetchPaths = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/paths', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const json = (await res.json()) as PathsResponse;
        setData(json);
      }
    } catch (e) {
      console.error('Failed to load paths', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchPaths();
  }, [user, router, fetchPaths]);

  const enroll = async (pathId: string, addToPlanner: boolean) => {
    if (!user) return;
    setActionPending(`enroll:${pathId}`);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/paths/enroll', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ pathId, addToPlanner, startDateISO: localDateKey() }),
      });
      if (res.ok) {
        trackEvent('path_enrolled', user.uid, { pathId, addToPlanner });
        await fetchPaths();
        router.refresh();
      }
    } finally {
      setActionPending(null);
    }
  };

  const completeModule = async (pathId: string, moduleId: string) => {
    if (!user) return;
    setActionPending(`complete:${moduleId}`);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/paths/complete-module', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ pathId, moduleId }),
      });
      if (res.ok) {
        trackEvent('path_module_completed', user.uid, { pathId, moduleId });
        await fetchPaths();
        router.refresh();
      }
    } finally {
      setActionPending(null);
    }
  };

  const togglePin = async (pathId: string, pinned: boolean) => {
    if (!user) return;
    setActionPending(`pin:${pathId}`);
    try {
      const token = await user.getIdToken();
      await fetch('/api/paths/pin', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ pathId, pinned }),
      });
      trackEvent('path_pinned', user.uid, { pathId, pinned });
      await fetchPaths();
    } finally {
      setActionPending(null);
    }
  };

  const unenroll = async (pathId: string) => {
    if (!user) return;
    if (!window.confirm('Remove this path from your active list? Your planner tasks stay.')) return;
    setActionPending(`unenroll:${pathId}`);
    try {
      const token = await user.getIdToken();
      await fetch('/api/paths/unenroll', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ pathId }),
      });
      trackEvent('path_unenrolled', user.uid, { pathId });
      await fetchPaths();
    } finally {
      setActionPending(null);
    }
  };

  const allPaths = data?.paths ?? [];
  const enrolledPaths = useMemo(() => allPaths.filter((p) => p.isEnrolled), [allPaths]);
  const otherPaths = useMemo(() => allPaths.filter((p) => !p.isEnrolled), [allPaths]);
  const filteredOther = useMemo(
    () => (filter === 'all' ? otherPaths : otherPaths.filter((p) => p.path.category === filter)),
    [otherPaths, filter]
  );
  const activePath = data?.activePath ?? null;
  const recommendations = data?.recommendations ?? [];

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-[var(--accent-blue)] mx-auto mb-3 animate-spin" />
          <p className="text-sm text-[var(--text-muted)]">Loading your capability paths...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-8 pb-16">
        {/* ─── Header ─── */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-xl bg-[var(--accent-blue-soft)] p-2.5">
              <GraduationCap className="h-5 w-5 text-[var(--accent-blue)]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Capability Paths</h1>
          </div>
          <p className="text-[var(--text-muted)] max-w-2xl">
            Structured, outcome-linked upskilling. Each path is built around the question: <em>what
            changes in your career when you finish?</em>
          </p>
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
                    onPin={() => togglePin(p.path.id, true)}
                    actionPending={actionPending}
                  />
                ))}
            </div>
          </motion.div>
        )}

        {/* ─── Recommended For You ─── */}
        {recommendations.length > 0 && (
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
              {recommendations.map((rec) => (
                <RecommendationCard
                  key={rec.path.id}
                  rec={rec}
                  onEnroll={(addToPlanner) => enroll(rec.path.id, addToPlanner)}
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
                  onEnroll={(addToPlanner) => enroll(p.path.id, addToPlanner)}
                  actionPending={actionPending}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
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

/* ─── Active Path Spotlight ─── */

function ActivePathSpotlight({
  progress,
  onCompleteModule,
  onTogglePin,
  onUnenroll,
  actionPending,
}: {
  progress: PathProgress;
  onCompleteModule: (moduleId: string) => void;
  onTogglePin: () => void;
  onUnenroll: () => void;
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

          <Button
            onClick={() => onCompleteModule(currentModule.id)}
            disabled={actionPending === `complete:${currentModule.id}`}
            size="sm"
            className="w-full sm:w-auto"
          >
            {actionPending === `complete:${currentModule.id}` ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Mark module complete
          </Button>
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
                <div
                  key={m.id}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${
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
                </div>
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
  onEnroll,
  actionPending,
}: {
  rec: PathRecommendation;
  onEnroll: (addToPlanner: boolean) => void;
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
            onClick={() => onEnroll(false)}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Start'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEnroll(true)}
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
  onEnroll,
  actionPending,
}: {
  progress: PathProgress;
  onEnroll: (addToPlanner: boolean) => void;
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

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onEnroll(false)}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Start path'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEnroll(true)}
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

/* ─── Mini card for other enrolled paths ─── */

function EnrolledMiniCard({
  progress,
  onPin,
  actionPending,
}: {
  progress: PathProgress;
  onPin: () => void;
  actionPending: string | null;
}) {
  const { path, currentModule, progressPercent } = progress;
  return (
    <Card className="hover-lift">
      <CardContent className="p-4 flex items-center gap-4">
        <ProgressRing percent={progressPercent} size={48} />
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold truncate">{path.title}</h4>
          <p className="text-xs text-[var(--text-muted)] truncate">
            {currentModule ? `Next: ${currentModule.title}` : 'All modules complete'}
          </p>
        </div>
        <button
          type="button"
          onClick={onPin}
          className="text-xs text-[var(--accent-blue)] hover:underline shrink-0"
          disabled={actionPending === `pin:${path.id}`}
        >
          Pin
        </button>
      </CardContent>
    </Card>
  );
}

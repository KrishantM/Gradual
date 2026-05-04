'use client';

/**
 * HorizonTimeline — premium visual timeline for an AI-generated pathway.
 *
 * Renders 5 horizons (Now, 30 days, 3 months, 6 months, 12 months) as
 * a connected sequence:
 *   - On desktop (≥lg) the horizons sit in a horizontal scroll-snapping rail
 *     with a connecting gradient line.
 *   - On mobile they collapse into a vertical timeline with a left rail.
 *
 * Each step inside a horizon shows its kind icon, title, rationale,
 * optional suggestions, and quick actions (Add to Planner, Open in G.ai,
 * Find opportunities).
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Brain,
  Hammer,
  BookOpen,
  Briefcase,
  Compass,
  CalendarPlus,
  Sparkles,
  Search,
  Check,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  HORIZON_LABEL,
  HORIZON_HELPER,
  HORIZON_ORDER,
  type GeneratedPathway,
  type HorizonKey,
  type PathwayStep,
} from '@/lib/paths/pathway-types';

const KIND_META: Record<
  PathwayStep['kind'],
  { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }
> = {
  skill: { label: 'Skill', icon: Brain, tone: 'accent-blue' },
  project: { label: 'Project', icon: Hammer, tone: 'success' },
  learning: { label: 'Learning', icon: BookOpen, tone: 'accent-purple' },
  experience: { label: 'Experience', icon: Briefcase, tone: 'warning' },
  opportunity: { label: 'Opportunity', icon: Compass, tone: 'accent-blue' },
};

function toneStyle(tone: string): { bg: string; fg: string; border: string } {
  switch (tone) {
    case 'success':
      return {
        bg: 'var(--success-soft)',
        fg: 'var(--success)',
        border: 'color-mix(in srgb, var(--success) 25%, transparent)',
      };
    case 'warning':
      return {
        bg: 'var(--warning-soft)',
        fg: 'var(--warning)',
        border: 'color-mix(in srgb, var(--warning) 25%, transparent)',
      };
    case 'accent-purple':
      return {
        bg: 'color-mix(in srgb, var(--accent-purple) 12%, transparent)',
        fg: 'var(--accent-purple)',
        border: 'color-mix(in srgb, var(--accent-purple) 25%, transparent)',
      };
    case 'accent-blue':
    default:
      return {
        bg: 'var(--accent-blue-soft)',
        fg: 'var(--accent-blue)',
        border: 'color-mix(in srgb, var(--accent-blue) 25%, transparent)',
      };
  }
}

interface Props {
  pathway: GeneratedPathway;
  onSendStepToPlanner?: (step: PathwayStep, horizon: HorizonKey) => Promise<void> | void;
  pendingStepId?: string | null;
  scheduledStepIds?: Set<string>;
}

export function HorizonTimeline({
  pathway,
  onSendStepToPlanner,
  pendingStepId,
  scheduledStepIds,
}: Props) {
  const router = useRouter();

  return (
    <div className="space-y-5">
      {/* Pathway header */}
      <div className="rounded-xl border border-[var(--border)] bg-gradient-to-br from-[var(--accent-blue-soft)] to-[var(--surface-card)] p-5 sm:p-6">
        <div className="flex items-start gap-3 mb-2">
          <div className="rounded-lg bg-[var(--accent-blue)]/15 p-2 shrink-0">
            <Sparkles className="h-4 w-4 text-[var(--accent-blue)]" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg sm:text-xl font-bold leading-tight">{pathway.title}</h3>
            {(pathway.targetRole || pathway.targetIndustry) && (
              <p className="text-[11px] sm:text-xs text-[var(--text-subtle)] mt-1 truncate">
                {[pathway.targetRole, pathway.targetIndustry].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>
        {pathway.summary && (
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">{pathway.summary}</p>
        )}
      </div>

      {/* Desktop: horizontal scroll rail with connector */}
      <div className="hidden lg:block relative">
        <div
          aria-hidden
          className="absolute left-4 right-4 top-[60px] h-px"
          style={{
            background:
              'linear-gradient(to right, color-mix(in srgb, var(--accent-blue) 60%, transparent), color-mix(in srgb, var(--accent-purple) 60%, transparent))',
          }}
        />
        <div className="grid grid-cols-5 gap-4 relative">
          {HORIZON_ORDER.map((key, idx) => {
            const horizon = pathway.horizons.find((h) => h.key === key);
            return (
              <HorizonColumn
                key={key}
                index={idx}
                horizonKey={key}
                outcome={horizon?.outcome ?? ''}
                steps={horizon?.steps ?? []}
                onSendStepToPlanner={onSendStepToPlanner}
                pendingStepId={pendingStepId}
                scheduledStepIds={scheduledStepIds}
                onFindOpportunities={() => router.push('/suggestions')}
                onOpenInGAi={(s) =>
                  router.push(`/copilot?prompt=${encodeURIComponent(`Help me work on: ${s.title}. ${s.rationale}`)}`)
                }
              />
            );
          })}
        </div>
      </div>

      {/* Mobile: vertical timeline */}
      <div className="lg:hidden relative space-y-5 pl-7">
        <div
          aria-hidden
          className="absolute left-3 top-2 bottom-2 w-px"
          style={{
            background:
              'linear-gradient(to bottom, color-mix(in srgb, var(--accent-blue) 60%, transparent), color-mix(in srgb, var(--accent-purple) 60%, transparent))',
          }}
        />
        {HORIZON_ORDER.map((key, idx) => {
          const horizon = pathway.horizons.find((h) => h.key === key);
          return (
            <div key={key} className="relative">
              <div
                className="absolute -left-7 top-1.5 h-6 w-6 rounded-full grid place-items-center text-[10px] font-bold ring-2 ring-[var(--surface)]"
                style={{
                  background:
                    idx === 0
                      ? 'var(--accent-blue)'
                      : 'color-mix(in srgb, var(--accent-blue) 50%, var(--accent-purple))',
                  color: 'white',
                }}
              >
                {idx + 1}
              </div>
              <HorizonColumn
                index={idx}
                horizonKey={key}
                outcome={horizon?.outcome ?? ''}
                steps={horizon?.steps ?? []}
                onSendStepToPlanner={onSendStepToPlanner}
                pendingStepId={pendingStepId}
                scheduledStepIds={scheduledStepIds}
                onFindOpportunities={() => router.push('/suggestions')}
                onOpenInGAi={(s) =>
                  router.push(`/copilot?prompt=${encodeURIComponent(`Help me work on: ${s.title}. ${s.rationale}`)}`)
                }
                compact
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ColumnProps {
  index: number;
  horizonKey: HorizonKey;
  outcome: string;
  steps: PathwayStep[];
  onSendStepToPlanner?: (step: PathwayStep, horizon: HorizonKey) => Promise<void> | void;
  pendingStepId?: string | null;
  scheduledStepIds?: Set<string>;
  onFindOpportunities: () => void;
  onOpenInGAi: (step: PathwayStep) => void;
  compact?: boolean;
}

function HorizonColumn({
  index,
  horizonKey,
  outcome,
  steps,
  onSendStepToPlanner,
  pendingStepId,
  scheduledStepIds,
  onFindOpportunities,
  onOpenInGAi,
  compact = false,
}: ColumnProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="flex flex-col"
    >
      {/* Header marker */}
      {!compact && (
        <div className="flex flex-col items-start mb-3">
          <div
            className="h-7 w-7 rounded-full grid place-items-center text-[11px] font-bold ring-2 ring-[var(--surface)] mb-2"
            style={{
              background:
                index === 0
                  ? 'var(--accent-blue)'
                  : 'color-mix(in srgb, var(--accent-blue) 50%, var(--accent-purple))',
              color: 'white',
            }}
          >
            {index + 1}
          </div>
        </div>
      )}

      <div className="mb-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-blue)]">
          {HORIZON_LABEL[horizonKey]}
        </p>
        <p className="text-[11px] text-[var(--text-subtle)]">{HORIZON_HELPER[horizonKey]}</p>
      </div>

      {outcome && (
        <p className="text-xs font-medium text-[var(--foreground)] leading-snug mb-3">{outcome}</p>
      )}

      <div className="space-y-2.5 flex-1">
        {steps.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--border-soft)] p-3 text-center text-[11px] text-[var(--text-subtle)]">
            No steps for this horizon
          </div>
        ) : (
          steps.map((step) => (
            <StepCard
              key={step.id}
              step={step}
              horizonKey={horizonKey}
              onSendToPlanner={onSendStepToPlanner}
              pending={pendingStepId === step.id}
              scheduled={scheduledStepIds?.has(step.id) ?? false}
              onFindOpportunities={onFindOpportunities}
              onOpenInGAi={onOpenInGAi}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}

interface StepCardProps {
  step: PathwayStep;
  horizonKey: HorizonKey;
  onSendToPlanner?: (step: PathwayStep, horizon: HorizonKey) => Promise<void> | void;
  pending: boolean;
  scheduled: boolean;
  onFindOpportunities: () => void;
  onOpenInGAi: (step: PathwayStep) => void;
}

function StepCard({
  step,
  horizonKey,
  onSendToPlanner,
  pending,
  scheduled,
  onFindOpportunities,
  onOpenInGAi,
}: StepCardProps) {
  const meta = KIND_META[step.kind];
  const tone = toneStyle(meta.tone);
  const Icon = meta.icon;
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-xl border bg-[var(--surface-card)] p-3 transition-all hover:shadow-sm"
      style={{ borderColor: 'var(--border)' }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-start gap-2 mb-1.5">
          <span
            className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide shrink-0"
            style={{ background: tone.bg, color: tone.fg, border: `1px solid ${tone.border}` }}
          >
            <Icon className="h-2.5 w-2.5" />
            {meta.label}
          </span>
          <ArrowRight
            className={`h-3 w-3 text-[var(--text-subtle)] mt-1 ml-auto shrink-0 transition-transform ${
              expanded ? 'rotate-90' : ''
            }`}
          />
        </div>
        <p className="text-[13px] font-semibold leading-snug text-[var(--foreground)]">
          {step.title}
        </p>
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.18 }}
          className="overflow-hidden"
        >
          <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-2">{step.rationale}</p>

          {step.suggestions && step.suggestions.length > 0 && (
            <ul className="mt-2 space-y-1">
              {step.suggestions.map((s, i) => (
                <li
                  key={i}
                  className="text-[11px] text-[var(--text-muted)] flex items-start gap-1.5"
                >
                  <span className="text-[var(--accent-blue)] mt-0.5">·</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap gap-1.5 mt-3">
            {onSendToPlanner && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSendToPlanner(step, horizonKey);
                }}
                disabled={pending || scheduled}
                className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[10px] font-medium text-[var(--foreground)] hover:bg-[var(--surface-subtle)] transition-colors disabled:opacity-60"
              >
                {pending ? (
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                ) : scheduled ? (
                  <Check className="h-2.5 w-2.5 text-[var(--success)]" />
                ) : (
                  <CalendarPlus className="h-2.5 w-2.5" />
                )}
                {scheduled ? 'In planner' : 'Plan'}
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenInGAi(step);
              }}
              className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[10px] font-medium text-[var(--foreground)] hover:bg-[var(--surface-subtle)] transition-colors"
            >
              <Sparkles className="h-2.5 w-2.5 text-[var(--accent-blue)]" />
              Ask G.ai
            </button>
            {step.kind === 'opportunity' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onFindOpportunities();
                }}
                className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[10px] font-medium text-[var(--foreground)] hover:bg-[var(--surface-subtle)] transition-colors"
              >
                <Search className="h-2.5 w-2.5" />
                Find
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

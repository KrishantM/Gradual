'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Brain, Target } from 'lucide-react';

export interface CVScoreCategory {
  key: string;
  label: string;
  score: number;
  rationale: string;
}

export interface CVScoreData {
  totalScore: number;
  breakdown: CVScoreCategory[];
  improvementSummary: string;
}

function getScoreClass(score: number, max: number) {
  const pct = (score / max) * 100;
  if (pct >= 80) return 'score-excellent';
  if (pct >= 60) return 'score-good';
  if (pct >= 40) return 'score-fair';
  return 'score-poor';
}

function getScoreToken(score: number, max: number) {
  const pct = (score / max) * 100;
  if (pct >= 80) return '--success';
  if (pct >= 60) return '--accent-blue';
  if (pct >= 40) return '--warning';
  return '--danger';
}

function CategoryRow({ category }: { category: CVScoreCategory }) {
  const [open, setOpen] = useState(false);
  const token = getScoreToken(category.score, 25);
  const pct = Math.max(4, Math.round((category.score / 25) * 100));

  return (
    <div className="border-b last:border-b-0" style={{ borderColor: 'var(--border-soft)' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-4 py-4 flex items-center gap-4 hover:bg-[var(--surface-subtle)] transition-colors duration-150"
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[var(--foreground)] truncate">{category.label}</span>
            <span className={`text-base font-semibold tabular-nums ${getScoreClass(category.score, 25)}`}>
              {category.score}
              <span className="text-[var(--text-subtle)] font-normal text-sm">/25</span>
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surface-subtle)' }}>
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${pct}%`, backgroundColor: `var(${token})` }}
            />
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--text-subtle)] transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 -mt-1">
              <div
                className="rounded-md p-3 text-sm leading-relaxed"
                style={{
                  backgroundColor: `color-mix(in srgb, var(${token}) 8%, var(--surface-subtle))`,
                  borderLeft: `3px solid var(${token})`,
                  color: 'var(--text-secondary)',
                }}
              >
                {category.rationale}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CVScoreDisplay({ data }: { data: CVScoreData }) {
  const overallToken = getScoreToken(data.totalScore, 100);
  const sumOfBreakdown = data.breakdown.reduce((acc, c) => acc + c.score, 0);

  return (
    <div className="space-y-6">
      {/* Overall score hero */}
      <div className="text-center py-2">
        <p className="text-xs font-medium tracking-widest uppercase text-[var(--text-muted)] mb-3">
          CV Score
        </p>
        <div className="inline-flex items-baseline">
          <span
            className="text-7xl font-bold tracking-tighter tabular-nums"
            style={{ color: `var(${overallToken})` }}
          >
            {data.totalScore}
          </span>
          <span className="text-2xl font-light text-[var(--text-muted)] ml-1">/100</span>
        </div>
        <p className="mt-2 text-xs text-[var(--text-subtle)]">
          Sum of four categories ({sumOfBreakdown}/100)
        </p>
      </div>

      {/* Breakdown */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <Brain className="h-4 w-4 text-[var(--accent-purple)]" />
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Scoring breakdown</h3>
          <span className="text-xs text-[var(--text-subtle)] ml-auto">Tap to see why</span>
        </div>
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-soft)' }}
        >
          {data.breakdown.map((category) => (
            <CategoryRow key={category.key} category={category} />
          ))}
        </div>
      </div>

      {/* Improvement summary */}
      <div className="card-section-accent">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-4 w-4 text-[var(--accent-blue)]" />
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Where to focus</h3>
        </div>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          {data.improvementSummary}
        </p>
      </div>
    </div>
  );
}

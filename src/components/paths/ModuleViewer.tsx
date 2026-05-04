'use client';

/**
 * ModuleViewer — full-screen course experience for a single capability
 * path module.
 *
 * Layout (top to bottom):
 *   1. Sticky header — back, path title, module N of M, mark-complete button
 *   2. Hero — module title + concept summary + estimated time
 *   3. Lessons — rich, paragraphed content with optional bullets and callouts
 *   4. Practical action + mini task (the "do something" panel)
 *   5. Quiz — interactive multiple-choice with feedback
 *   6. Key takeaways
 *   7. AI tailoring "coming soon" banner — sets expectations for adaptive
 *      learning where future quiz performance shapes follow-up content
 *
 * Modules with no `lessons`, `quiz`, or `keyTakeaways` show a graceful
 * "richer lesson content coming soon" hint instead of those sections.
 */

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Lightbulb,
  Target,
  ListChecks,
  Brain,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Loader2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Path, PathModule, PathQuizQuestion } from '@/lib/paths/types';

interface ModuleViewerProps {
  path: Path;
  module: PathModule;
  moduleIndex: number;
  /** ids the user has already completed — drives the "Already complete" state */
  completedModuleIds: string[];
  onClose: () => void;
  onComplete: () => Promise<void> | void;
  isCompleting?: boolean;
}

export function ModuleViewer(props: ModuleViewerProps) {
  const { path, module, moduleIndex, completedModuleIds, onClose, onComplete, isCompleting } =
    props;
  const isAlreadyComplete = completedModuleIds.includes(module.id);
  const totalCount = path.modules.length;

  // Lock body scroll while viewer is mounted
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Esc closes the viewer
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-50 bg-[var(--surface)] overflow-y-auto"
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 backdrop-blur-md bg-[var(--surface)]/85 border-b border-[var(--border-soft)]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[var(--surface-subtle)] transition-colors"
              aria-label="Close module"
            >
              <ArrowLeft className="h-4 w-4 text-[var(--text-muted)]" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)] truncate">
                {path.title} · Module {moduleIndex + 1} of {totalCount}
              </p>
              <h2 className="text-sm font-semibold text-[var(--foreground)] truncate">
                {module.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="hidden sm:inline-flex p-2 rounded-lg hover:bg-[var(--surface-subtle)] transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-[var(--text-muted)]" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="rounded-lg bg-[var(--accent-blue-soft)] p-1.5">
                <BookOpen className="h-3.5 w-3.5 text-[var(--accent-blue)]" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-blue)]">
                Module {moduleIndex + 1}
              </span>
              <span className="text-xs text-[var(--text-subtle)] flex items-center gap-1 ml-auto">
                <Clock className="h-3 w-3" /> {module.estimatedMinutes} min
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">{module.title}</h1>
            <p className="text-base text-[var(--text-muted)] leading-relaxed">{module.concept}</p>
          </motion.div>

          {/* Lessons */}
          {module.lessons && module.lessons.length > 0 ? (
            <div className="space-y-6 mb-10">
              {module.lessons.map((lesson, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 * i }}
                >
                  <Card>
                    <CardContent className="p-5 sm:p-6">
                      <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] text-[10px] font-bold">
                          {i + 1}
                        </span>
                        {lesson.heading}
                      </h3>
                      <div className="space-y-3 text-sm text-[var(--text-muted)] leading-relaxed">
                        {lesson.body.split(/\n{2,}/).map((para, pi) => (
                          <p key={pi}>{para}</p>
                        ))}
                      </div>
                      {lesson.bullets && lesson.bullets.length > 0 && (
                        <ul className="mt-4 space-y-2">
                          {lesson.bullets.map((b, bi) => (
                            <li key={bi} className="flex items-start gap-2 text-sm">
                              <Circle className="h-1.5 w-1.5 mt-2 fill-[var(--accent-blue)] text-[var(--accent-blue)] shrink-0" />
                              <span className="text-[var(--text-muted)]">{b}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {lesson.callout && (
                        <div className="mt-4 rounded-lg border border-[var(--accent-blue)]/15 bg-[var(--accent-blue-soft)]/40 px-4 py-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-blue)] mb-1">
                            {lesson.callout.label}
                          </p>
                          <p className="text-sm text-[var(--foreground)]">{lesson.callout.text}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="mb-10">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-[var(--accent-blue)]" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-blue)]">
                    Richer lessons coming soon
                  </p>
                </div>
                <p className="text-sm text-[var(--text-muted)]">
                  Detailed lesson content for this module is being authored. The concept above
                  captures the core idea — try the practical action below to get hands-on now.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Practical action + mini task */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="mb-10"
          >
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-[var(--accent-blue)]" />
              <h3 className="text-base font-semibold">Try it now</h3>
            </div>
            <Card>
              <CardContent className="p-5 sm:p-6">
                <div className="mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)] mb-1">
                    Practical action
                  </p>
                  <p className="text-sm text-[var(--foreground)]">{module.practicalAction}</p>
                </div>
                <div className="rounded-lg border border-[var(--accent-blue)]/15 bg-[var(--accent-blue-soft)]/40 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-blue)] mb-1">
                    Mini task
                  </p>
                  <p className="text-sm text-[var(--foreground)]">{module.miniTask}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quiz */}
          {module.quiz && module.quiz.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="mb-10"
            >
              <QuizSection questions={module.quiz} />
            </motion.div>
          )}

          {/* Key takeaways */}
          {module.keyTakeaways && module.keyTakeaways.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
              className="mb-10"
            >
              <div className="flex items-center gap-2 mb-3">
                <ListChecks className="h-4 w-4 text-[var(--accent-blue)]" />
                <h3 className="text-base font-semibold">Key takeaways</h3>
              </div>
              <Card>
                <CardContent className="p-5 sm:p-6">
                  <ul className="space-y-3">
                    {module.keyTakeaways.map((k, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 text-[var(--success)] mt-0.5 shrink-0" />
                        <span className="text-sm text-[var(--foreground)]">{k}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* AI Coming Soon */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="mb-10"
          >
            <AIComingSoonBanner />
          </motion.div>

          {/* Mark complete CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.35 }}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-5 sm:p-6 text-center"
          >
            {isAlreadyComplete ? (
              <div className="flex items-center justify-center gap-2 text-[var(--success)]">
                <CheckCircle2 className="h-5 w-5" />
                <p className="text-sm font-semibold">You&apos;ve already completed this module</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  Done with this module? Mark it complete to advance the path.
                </p>
                <Button
                  onClick={onComplete}
                  disabled={isCompleting}
                  className="w-full sm:w-auto"
                  size="lg"
                >
                  {isCompleting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Mark module complete
                </Button>
              </>
            )}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Quiz Section ─── */

interface QuizSectionProps {
  questions: PathQuizQuestion[];
}

function QuizSection({ questions }: QuizSectionProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [showSummary, setShowSummary] = useState(false);

  const allAnswered = useMemo(
    () => questions.every((q) => answers[q.id] !== undefined),
    [questions, answers]
  );

  const correctCount = useMemo(
    () =>
      questions.reduce((acc, q) => {
        const idx = answers[q.id];
        if (idx === undefined) return acc;
        return q.options[idx]?.isCorrect ? acc + 1 : acc;
      }, 0),
    [questions, answers]
  );

  const wrongQuestionTitles = useMemo(
    () =>
      questions
        .filter((q) => {
          const idx = answers[q.id];
          return idx !== undefined && !q.options[idx]?.isCorrect;
        })
        .map((q) => q.prompt),
    [questions, answers]
  );

  const select = (qid: string, idx: number) => {
    if (revealed[qid]) return; // already locked
    setAnswers((a) => ({ ...a, [qid]: idx }));
    setRevealed((r) => ({ ...r, [qid]: true }));
  };

  const reset = () => {
    setAnswers({});
    setRevealed({});
    setShowSummary(false);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Brain className="h-4 w-4 text-[var(--accent-blue)]" />
        <h3 className="text-base font-semibold">Check your understanding</h3>
      </div>

      <div className="space-y-4">
        {questions.map((q, qi) => {
          const selectedIdx = answers[q.id];
          const isRevealed = revealed[q.id] ?? false;
          return (
            <Card key={q.id}>
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-start gap-2 mb-4">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] text-[10px] font-bold shrink-0 mt-0.5">
                    {qi + 1}
                  </span>
                  <p className="text-sm font-semibold">{q.prompt}</p>
                </div>

                <div className="space-y-2">
                  {q.options.map((opt, oi) => {
                    const isSelected = selectedIdx === oi;
                    const isCorrect = opt.isCorrect;
                    const showState = isRevealed && (isSelected || isCorrect);
                    let stateClasses =
                      'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent-blue)]/40';
                    if (showState && isCorrect) {
                      stateClasses =
                        'border-[var(--success)]/40 bg-[var(--success-soft)] text-[var(--foreground)]';
                    } else if (showState && isSelected && !isCorrect) {
                      stateClasses =
                        'border-[var(--danger)]/40 bg-[var(--danger-soft)] text-[var(--foreground)]';
                    } else if (isRevealed) {
                      stateClasses = 'border-[var(--border-soft)] bg-[var(--surface)] opacity-60';
                    }
                    return (
                      <button
                        type="button"
                        key={oi}
                        onClick={() => select(q.id, oi)}
                        disabled={isRevealed}
                        className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all duration-150 flex items-start gap-3 ${stateClasses} ${
                          isRevealed ? 'cursor-default' : 'cursor-pointer'
                        }`}
                      >
                        <span className="text-xs font-bold uppercase text-[var(--text-subtle)] shrink-0 mt-0.5">
                          {String.fromCharCode(65 + oi)}
                        </span>
                        <span className="text-sm flex-1">{opt.text}</span>
                        {showState && isCorrect && (
                          <CheckCircle2 className="h-4 w-4 text-[var(--success)] shrink-0 mt-0.5" />
                        )}
                        {showState && isSelected && !isCorrect && (
                          <X className="h-4 w-4 text-[var(--danger)] shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {isRevealed && selectedIdx !== undefined && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-3"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Lightbulb className="h-3.5 w-3.5 text-[var(--accent-blue)]" />
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-blue)]">
                        {q.options[selectedIdx]?.isCorrect ? 'Correct' : 'Not quite'}
                      </p>
                    </div>
                    <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                      {q.options[selectedIdx]?.explanation}
                    </p>
                  </motion.div>
                )}

                {!isRevealed && q.hint && (
                  <details className="mt-3">
                    <summary className="text-xs text-[var(--text-subtle)] cursor-pointer hover:text-[var(--accent-blue)]">
                      Show hint
                    </summary>
                    <p className="mt-2 text-xs text-[var(--text-muted)] pl-4 border-l-2 border-[var(--accent-blue)]/40">
                      {q.hint}
                    </p>
                  </details>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary CTA */}
      {allAnswered && !showSummary && (
        <div className="mt-5 flex flex-col sm:flex-row gap-2">
          <Button onClick={() => setShowSummary(true)} className="flex-1">
            See your score
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="h-4 w-4 mr-2" /> Reset
          </Button>
        </div>
      )}

      {showSummary && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-5"
        >
          <Card className="border-[var(--accent-blue)]/20">
            <CardContent className="p-5 sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-blue)] mb-2">
                Your score
              </p>
              <p className="text-3xl font-bold mb-2">
                {correctCount}
                <span className="text-base font-medium text-[var(--text-subtle)]">
                  /{questions.length}
                </span>
              </p>
              <p className="text-sm text-[var(--text-muted)] mb-4">
                {correctCount === questions.length
                  ? 'Perfect — you have the core ideas locked in.'
                  : correctCount >= Math.ceil(questions.length * 0.7)
                    ? 'Strong — review the questions you missed and you are ready to apply this.'
                    : 'Worth another pass — re-read the lessons above and retry.'}
              </p>

              {wrongQuestionTitles.length > 0 && (
                <div className="rounded-lg border border-[var(--accent-purple)]/20 bg-[var(--accent-purple-soft)]/30 px-4 py-3 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-3.5 w-3.5 text-[var(--accent-purple)]" />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-purple)]">
                      Coming soon · adaptive review
                    </p>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mb-2">
                    Soon, Gradual will use the questions you got wrong to generate a tailored
                    follow-up — focused micro-lessons on exactly the gaps that matter to you. For
                    now, you missed:
                  </p>
                  <ul className="space-y-1">
                    {wrongQuestionTitles.map((t, i) => (
                      <li key={i} className="text-xs text-[var(--text-muted)] flex items-start gap-1.5">
                        <Circle className="h-1.5 w-1.5 mt-1.5 fill-[var(--accent-purple)] text-[var(--accent-purple)] shrink-0" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button variant="outline" size="sm" onClick={reset}>
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Try again
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

/* ─── AI Coming Soon Banner ─── */

function AIComingSoonBanner() {
  return (
    <Card className="border-[var(--accent-purple)]/20 overflow-hidden">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-[var(--accent-purple-soft)] p-2.5 shrink-0">
            <Sparkles className="h-5 w-5 text-[var(--accent-purple)]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-purple)]">
                Coming soon
              </p>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-purple-soft)] text-[var(--accent-purple)] font-semibold">
                Adaptive AI
              </span>
            </div>
            <h3 className="text-base font-semibold mb-2">Lessons that learn from you</h3>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-3">
              We&apos;re building a layer where Gradual&apos;s AI watches the questions you miss
              and the practical actions you complete, then dynamically generates follow-up lessons
              tailored to your weak spots. Expect:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                <Circle className="h-1.5 w-1.5 mt-2 fill-[var(--accent-purple)] text-[var(--accent-purple)] shrink-0" />
                <span>
                  <span className="text-[var(--foreground)] font-medium">Personalised drills</span>{' '}
                  — extra exercises generated against the concepts you got wrong
                </span>
              </li>
              <li className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                <Circle className="h-1.5 w-1.5 mt-2 fill-[var(--accent-purple)] text-[var(--accent-purple)] shrink-0" />
                <span>
                  <span className="text-[var(--foreground)] font-medium">Live tutor mode</span> —
                  ask follow-up questions inline and get answers grounded in this lesson
                </span>
              </li>
              <li className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                <Circle className="h-1.5 w-1.5 mt-2 fill-[var(--accent-purple)] text-[var(--accent-purple)] shrink-0" />
                <span>
                  <span className="text-[var(--foreground)] font-medium">Career-aware framing</span>{' '}
                  — examples adapted to your CV, target roles, and current applications
                </span>
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

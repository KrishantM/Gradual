'use client';

/**
 * G.ai pane — Cursor-style sliding side panel for the Paths surface.
 *
 * Lets a user converse with G.ai while planning paths, browsing modules, or
 * viewing a lesson without ever leaving the Paths page. Mounts a floating
 * launcher button (bottom-right) and a right-edge drawer.
 *
 * Surface awareness:
 *   - The pane forwards the current path/module via /api/copilot/chat's
 *     pathContext field so G.ai can ground its replies in the lesson the
 *     user is on.
 *   - When the user opens a module in <ModuleViewer>, the parent updates
 *     `pathContext` and the pane shows a context chip reflecting the change.
 *
 * Actions:
 *   - Suggested todos returned by G.ai render inline with an "Add to planner"
 *     button that POSTs to /api/planner/events with source=copilot, no full
 *     navigation away from Paths.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Send,
  X,
  CalendarPlus,
  Loader2,
  Minimize2,
  Lightbulb,
  Check,
  AlertCircle,
} from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import type { GaiAction } from '@/types/copilot';
import { GaiActionCards } from '@/components/copilot/GaiActionCards';
import { AutonomySelector } from '@/components/copilot/AutonomySelector';
import { MarkdownMessage } from '@/components/copilot/MarkdownMessage';
import { streamCopilotChat } from '@/lib/copilot/chat-stream';

export interface GaiPaneContext {
  pathId: string;
  pathTitle: string;
  moduleId?: string;
  moduleTitle?: string;
  currentConcept?: string;
}

interface GaiPaneProps {
  user: User;
  /** Current surface context — path/module the user is looking at. */
  context: GaiPaneContext | null;
  /** Whether the launcher button + pane are mounted at all. */
  enabled?: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
  /** Structured suggestions returned alongside the assistant reply (manual mode). */
  suggestedTodos?: { title: string; notes?: string; priority?: string }[];
  priorities?: { title: string; rationale: string }[];
  /** Agentic actions G.ai took or proposed this turn. */
  executedActions?: GaiAction[];
  proposedActions?: GaiAction[];
  /** Suggested next-step prompts the user can tap to send as a follow-up. */
  followUps?: string[];
  undoToken?: string;
  undoExpiresAt?: string;
  /** True while this assistant reply is still streaming in. */
  streaming?: boolean;
}

const SUGGESTED_PROMPTS_DEFAULT = [
  'What should I focus on this week to advance my paths?',
  'Plan tomorrow around my current module.',
  'Quiz me on what I just learnt.',
];

function suggestedPromptsFor(ctx: GaiPaneContext | null): string[] {
  if (!ctx) return SUGGESTED_PROMPTS_DEFAULT;
  const prompts: string[] = [];
  if (ctx.moduleTitle) {
    prompts.push(`Explain "${ctx.moduleTitle}" like I'm new to it.`);
    prompts.push(`Give me a short quiz on "${ctx.moduleTitle}".`);
    prompts.push(`Help me apply this lesson to a real situation.`);
    prompts.push(`Add this module's mini task to my planner for tomorrow.`);
  } else {
    prompts.push(`How does "${ctx.pathTitle}" fit my career goals?`);
    prompts.push(`Plan my next 3 days around "${ctx.pathTitle}".`);
    prompts.push(`What should I do BEFORE starting this path?`);
  }
  return prompts.slice(0, 4);
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function tomorrowKey(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function GaiPane({ user, context, enabled = true }: GaiPaneProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [streamStatus, setStreamStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addedKeys, setAddedKeys] = useState<Record<string, 'pending' | 'added' | 'error'>>({});
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const prompts = useMemo(() => suggestedPromptsFor(context), [context]);

  // Auto-scroll on new messages.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  // Cmd/Ctrl + I to toggle.
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, open]);

  // Focus input when opened.
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  const sendMessage = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || isSending) return;

      const now = Date.now();
      const userMsg: ChatMessage = {
        id: `u-${now}`,
        role: 'user',
        content: text,
        createdAt: now,
      };
      const assistantId = `a-${now}`;
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        createdAt: now,
        streaming: true,
      };
      setMessages((m) => [...m, userMsg, assistantMsg]);
      setInput('');
      setIsSending(true);
      setStreamStatus(null);
      setError(null);

      const patchAssistant = (patch: Partial<ChatMessage>) =>
        setMessages((m) => m.map((x) => (x.id === assistantId ? { ...x, ...patch } : x)));

      try {
        const token = await user.getIdToken();
        const result = await streamCopilotChat(
          {
            token,
            message: text,
            mode: 'suggest',
            clientDateISO: todayKey(),
            pathContext: context ?? undefined,
          },
          {
            onToken: (delta) =>
              setMessages((m) =>
                m.map((x) => (x.id === assistantId ? { ...x, content: x.content + delta } : x))
              ),
            onStatus: (status) => setStreamStatus(status),
            onMeta: (meta) =>
              patchAssistant({
                suggestedTodos: meta.suggestedTodos?.length ? meta.suggestedTodos : undefined,
                priorities: meta.priorities?.length ? meta.priorities : undefined,
                executedActions: meta.executedActions?.length ? meta.executedActions : undefined,
                proposedActions: meta.proposedActions?.length ? meta.proposedActions : undefined,
                followUps: meta.followUps?.length ? meta.followUps : undefined,
                undoToken: meta.undoToken,
                undoExpiresAt: meta.undoExpiresAt,
              }),
          }
        );

        if (!result.ok) {
          // Drop the empty assistant placeholder and surface the error.
          setMessages((m) => m.filter((x) => x.id !== assistantId));
          setError(result.error ?? 'G.ai is unreachable right now. Try again.');
          return;
        }

        patchAssistant({
          content: result.answer || 'No reply generated.',
          streaming: false,
        });
        trackEvent('gai_pane_message', user.uid, {
          pathId: context?.pathId,
          moduleId: context?.moduleId,
          hasTodos: Boolean(result.response?.suggestedTodos?.length),
          actionsExecuted: result.response?.executedActions?.length ?? 0,
          actionsProposed: result.response?.proposedActions?.length ?? 0,
        });
      } catch (e) {
        console.error('[GaiPane] sendMessage failed', e);
        setMessages((m) => m.filter((x) => x.id !== assistantId));
        setError('Something went wrong sending that. Try again.');
      } finally {
        setIsSending(false);
        setStreamStatus(null);
      }
    },
    [isSending, user, context]
  );

  const addTodoToPlanner = useCallback(
    async (msgId: string, todoIndex: number, todo: { title: string; notes?: string }, when: 'today' | 'tomorrow') => {
      const key = `${msgId}:${todoIndex}:${when}`;
      setAddedKeys((s) => ({ ...s, [key]: 'pending' }));
      try {
        const token = await user.getIdToken();
        const date = when === 'today' ? todayKey() : tomorrowKey();
        const res = await fetch('/api/planner/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            date,
            title: todo.title,
            notes: todo.notes,
            source: 'copilot',
          }),
        });
        if (!res.ok) {
          setAddedKeys((s) => ({ ...s, [key]: 'error' }));
          return;
        }
        setAddedKeys((s) => ({ ...s, [key]: 'added' }));
        trackEvent('gai_pane_todo_to_planner', user.uid, {
          when,
          pathId: context?.pathId,
        });
      } catch (e) {
        console.error('[GaiPane] addTodoToPlanner failed', e);
        setAddedKeys((s) => ({ ...s, [key]: 'error' }));
      }
    },
    [user, context]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void sendMessage(input);
      }
    },
    [input, sendMessage]
  );

  const handleOpen = useCallback(() => {
    setOpen(true);
    trackEvent('gai_pane_opened', user.uid, {
      pathId: context?.pathId,
      moduleId: context?.moduleId,
    });
  }, [user.uid, context]);

  if (!enabled) return null;

  return (
    <>
      {/* Launcher (only when closed) */}
      <AnimatePresence>
        {!open && (
          <motion.button
            type="button"
            onClick={handleOpen}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-5 right-5 z-[80] flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-2.5 shadow-lg hover:shadow-xl transition-all hover:border-[var(--accent-blue)]/40"
            aria-label="Open G.ai"
          >
            <span className="rounded-full bg-[var(--accent-blue-soft)] p-1">
              <Sparkles className="h-3.5 w-3.5 text-[var(--accent-blue)]" />
            </span>
            <span className="text-sm font-medium text-[var(--foreground)]">Ask G.ai</span>
            <kbd className="hidden sm:inline-flex items-center text-[10px] text-[var(--text-subtle)] border border-[var(--border-soft)] rounded px-1.5 py-0.5 font-mono">
              ⌘I
            </kbd>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Pane */}
      <AnimatePresence>
        {open && (
          <>
            {/* Mobile-only backdrop. On desktop the pane is non-blocking. */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[90] bg-black/30 sm:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.22, ease: 'easeOut' }}
              className="fixed top-0 right-0 z-[100] h-full w-full sm:w-[420px] flex flex-col bg-[var(--surface-elevated)] border-l border-[var(--border)] shadow-2xl"
              role="dialog"
              aria-label="G.ai assistant"
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--border-soft)]">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="rounded-lg bg-[var(--accent-blue-soft)] p-1.5 shrink-0">
                    <Sparkles className="h-4 w-4 text-[var(--accent-blue)]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight">G.ai</p>
                    <p className="text-[11px] text-[var(--text-subtle)] leading-tight truncate">
                      Career AI · grounded in your Paths
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-[var(--surface-subtle)] transition-colors"
                    title="Minimise (Esc)"
                  >
                    <Minimize2 className="h-4 w-4 text-[var(--text-subtle)]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-[var(--surface-subtle)] transition-colors sm:hidden"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4 text-[var(--text-subtle)]" />
                  </button>
                </div>
              </div>

              {/* Context chip */}
              {context && (
                <div className="px-4 py-2 border-b border-[var(--border-soft)] bg-[var(--surface-subtle)]/50">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)] mb-0.5">
                    Context
                  </p>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed truncate">
                    {context.moduleTitle ? (
                      <>
                        Module <span className="text-[var(--foreground)] font-medium">{context.moduleTitle}</span> on{' '}
                        <span className="text-[var(--foreground)] font-medium">{context.pathTitle}</span>
                      </>
                    ) : (
                      <>
                        Path <span className="text-[var(--foreground)] font-medium">{context.pathTitle}</span>
                      </>
                    )}
                  </p>
                </div>
              )}

              {/* Autonomy control */}
              <div className="px-4 py-2 border-b border-[var(--border-soft)] flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)] shrink-0">
                  Mode
                </span>
                <AutonomySelector user={user} compact />
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {messages.length === 0 && !isSending && (
                  <div className="flex flex-col items-center text-center pt-8">
                    <div className="rounded-2xl bg-[var(--accent-blue-soft)] p-3 mb-3">
                      <Sparkles className="h-5 w-5 text-[var(--accent-blue)]" />
                    </div>
                    <p className="text-sm font-semibold mb-1">How can G.ai help?</p>
                    <p className="text-xs text-[var(--text-muted)] mb-4 max-w-[280px]">
                      Ask about your current path, plan around a module, or get a quick quiz.
                    </p>
                    <div className="w-full space-y-1.5">
                      {prompts.map((p) => (
                        <button
                          type="button"
                          key={p}
                          onClick={() => void sendMessage(p)}
                          className="w-full text-left rounded-lg border border-[var(--border)] hover:border-[var(--accent-blue)]/40 bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-subtle)] transition-all"
                        >
                          <Lightbulb className="inline h-3 w-3 text-[var(--accent-blue)] mr-1.5 -mt-0.5" />
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((m) => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    user={user}
                    streamStatus={streamStatus}
                    onAddToPlanner={(idx, todo, when) => void addTodoToPlanner(m.id, idx, todo, when)}
                    onFollowUp={(prompt) => void sendMessage(prompt)}
                    isSending={isSending}
                    addedKeys={addedKeys}
                  />
                ))}

                {error && (
                  <div className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-3 py-2 flex items-start gap-2">
                    <AlertCircle className="h-3.5 w-3.5 text-[var(--danger)] mt-0.5 shrink-0" />
                    <p className="text-xs text-[var(--danger)]">{error}</p>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-[var(--border-soft)] p-3">
                <div className="flex items-end gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] focus-within:border-[var(--accent-blue)]/50 transition-colors px-3 py-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    placeholder={context?.moduleTitle ? `Ask about "${context.moduleTitle}"…` : 'Ask G.ai anything…'}
                    className="flex-1 bg-transparent resize-none text-sm text-[var(--foreground)] placeholder-[var(--text-subtle)] focus:outline-none max-h-32"
                    disabled={isSending}
                  />
                  <button
                    type="button"
                    onClick={() => void sendMessage(input)}
                    disabled={!input.trim() || isSending}
                    className="rounded-lg bg-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/90 disabled:opacity-40 disabled:cursor-not-allowed text-white p-1.5 transition-colors shrink-0"
                    aria-label="Send"
                  >
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1.5 text-[10px] text-[var(--text-subtle)] text-center">
                  Enter to send · Shift+Enter for new line · ⌘I to toggle
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Message bubble ─── */

function MessageBubble({
  message,
  user,
  streamStatus,
  onAddToPlanner,
  onFollowUp,
  isSending,
  addedKeys,
}: {
  message: ChatMessage;
  user: User;
  /** Transient tool status — only applies while this message is streaming. */
  streamStatus?: string | null;
  onAddToPlanner: (todoIndex: number, todo: { title: string; notes?: string }, when: 'today' | 'tomorrow') => void;
  onFollowUp: (prompt: string) => void;
  isSending: boolean;
  addedKeys: Record<string, 'pending' | 'added' | 'error'>;
}) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-[var(--accent-blue)] text-white px-3.5 py-2 text-sm whitespace-pre-wrap break-words">
          {message.content}
        </div>
      </div>
    );
  }

  // Streaming, no text yet — show the thinking indicator.
  if (message.streaming && !message.content) {
    return (
      <div className="flex items-center gap-2 text-xs text-[var(--text-subtle)]">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>{streamStatus ?? 'G.ai is thinking…'}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-[var(--foreground)] break-words">
        <MarkdownMessage content={message.content} className="inline" />
        {message.streaming && (
          <span className="inline-block w-1.5 h-3.5 ml-0.5 -mb-0.5 align-middle bg-[var(--accent-blue)]/60 animate-pulse rounded-sm" />
        )}
      </div>

      {message.streaming && streamStatus && (
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-subtle)]">
          <Loader2 className="h-3 w-3 animate-spin" />
          {streamStatus}
        </div>
      )}

      {((message.executedActions?.length ?? 0) > 0 || (message.proposedActions?.length ?? 0) > 0) && (
        <GaiActionCards
          user={user}
          executed={message.executedActions}
          proposed={message.proposedActions}
          undoToken={message.undoToken}
          undoExpiresAt={message.undoExpiresAt}
          clientDateISO={todayKey()}
        />
      )}

      {message.priorities && message.priorities.length > 0 && (
        <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface-subtle)]/60 p-3 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)]">Priorities</p>
          {message.priorities.slice(0, 4).map((p, i) => (
            <div key={i} className="text-xs">
              <p className="font-semibold text-[var(--foreground)]">{p.title}</p>
              {p.rationale && <p className="text-[var(--text-muted)] mt-0.5">{p.rationale}</p>}
            </div>
          ))}
        </div>
      )}

      {message.suggestedTodos && message.suggestedTodos.length > 0 && (
        <div className="rounded-lg border border-[var(--accent-blue)]/15 bg-[var(--accent-blue-soft)]/30 p-3 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-blue)]">
            Suggested actions
          </p>
          {message.suggestedTodos.slice(0, 4).map((t, i) => {
            const todayKeyState = addedKeys[`${message.id}:${i}:today`];
            const tomorrowKeyState = addedKeys[`${message.id}:${i}:tomorrow`];
            return (
              <div key={i} className="rounded-md bg-[var(--surface)] border border-[var(--border-soft)] p-2.5">
                <p className="text-xs font-semibold text-[var(--foreground)]">{t.title}</p>
                {t.notes && (
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed">{t.notes}</p>
                )}
                <div className="flex gap-1.5 mt-2">
                  <PlannerButton
                    state={todayKeyState}
                    onClick={() => onAddToPlanner(i, t, 'today')}
                    label="Today"
                  />
                  <PlannerButton
                    state={tomorrowKeyState}
                    onClick={() => onAddToPlanner(i, t, 'tomorrow')}
                    label="Tomorrow"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!message.streaming && message.followUps && message.followUps.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)]">
            Suggested next steps
          </p>
          {message.followUps.slice(0, 3).map((f, i) => (
            <button
              type="button"
              key={i}
              onClick={() => onFollowUp(f)}
              disabled={isSending}
              className="w-full text-left rounded-lg border border-[var(--border)] hover:border-[var(--accent-blue)]/40 bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-subtle)] transition-all disabled:opacity-50"
            >
              <Lightbulb className="inline h-3 w-3 text-[var(--accent-blue)] mr-1.5 -mt-0.5" />
              {f}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PlannerButton({
  state,
  onClick,
  label,
}: {
  state?: 'pending' | 'added' | 'error';
  onClick: () => void;
  label: string;
}) {
  if (state === 'added') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-[var(--success)] px-2 py-1 rounded-md bg-[var(--success-soft)]">
        <Check className="h-3 w-3" />
        Added · {label}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state === 'pending'}
      className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--accent-blue)] px-2 py-1 rounded-md border border-[var(--border-soft)] hover:border-[var(--accent-blue)]/30 transition-colors disabled:opacity-50"
    >
      {state === 'pending' ? <Loader2 className="h-3 w-3 animate-spin" /> : <CalendarPlus className="h-3 w-3" />}
      {label}
      {state === 'error' && <span className="text-[var(--danger)] ml-1">retry</span>}
    </button>
  );
}

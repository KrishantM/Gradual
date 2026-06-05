'use client';

/**
 * GaiActionCards — renders the actions G.ai's agent took or proposed in a turn.
 *
 * - executed actions (full_auto): shown as a completed list with a single
 *   "Undo" affordance covering the reversible writes from that turn.
 * - proposed actions (confirm mode): each shown with Confirm / Dismiss buttons
 *   that hit /api/copilot/confirm with the opaque pending id.
 *
 * Used by both the Copilot page and the Paths-side G.ai pane.
 */

import { useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Undo2,
  Check,
  X,
  Zap,
} from 'lucide-react';
import type { GaiAction } from '@/types/copilot';

interface GaiActionCardsProps {
  user: User;
  executed?: GaiAction[];
  proposed?: GaiAction[];
  undoToken?: string;
  undoExpiresAt?: string;
  /** User's local date — forwarded to /api/copilot/confirm for correct scheduling. */
  clientDateISO: string;
}

type UndoState = 'idle' | 'pending' | 'done' | 'error';
type ProposalState = { status: 'idle' | 'pending' | 'confirmed' | 'declined' | 'error'; detail?: string };

export function GaiActionCards({
  user,
  executed,
  proposed,
  undoToken,
  undoExpiresAt,
  clientDateISO,
}: GaiActionCardsProps) {
  const [undoState, setUndoState] = useState<UndoState>('idle');
  const [proposalStates, setProposalStates] = useState<Record<string, ProposalState>>({});

  const hasExecuted = (executed?.length ?? 0) > 0;
  const hasProposed = (proposed?.length ?? 0) > 0;

  // Undo is only offered while the 5-minute window is open.
  const undoStillOpen = useMemo(() => {
    if (!undoToken || !undoExpiresAt) return false;
    return new Date(undoExpiresAt).getTime() > Date.now();
  }, [undoToken, undoExpiresAt]);

  if (!hasExecuted && !hasProposed) return null;

  const runUndo = async () => {
    if (!undoToken) return;
    setUndoState('pending');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/copilot/undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ undoToken }),
      });
      setUndoState(res.ok ? 'done' : 'error');
    } catch {
      setUndoState('error');
    }
  };

  const resolveProposal = async (action: GaiAction, decline: boolean) => {
    setProposalStates((s) => ({ ...s, [action.id]: { status: 'pending' } }));
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/copilot/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pendingId: action.id, decline, clientDateISO }),
      });
      const data = (await res.json().catch(() => ({}))) as { detail?: string; error?: string };
      if (!res.ok) {
        setProposalStates((s) => ({
          ...s,
          [action.id]: { status: 'error', detail: data.error ?? 'Could not complete that.' },
        }));
        return;
      }
      setProposalStates((s) => ({
        ...s,
        [action.id]: {
          status: decline ? 'declined' : 'confirmed',
          detail: decline ? undefined : data.detail,
        },
      }));
    } catch {
      setProposalStates((s) => ({ ...s, [action.id]: { status: 'error', detail: 'Network error.' } }));
    }
  };

  return (
    <div className="space-y-2">
      {/* Executed actions */}
      {hasExecuted && (
        <div className="rounded-lg border border-[var(--success)]/20 bg-[var(--success-soft)]/40 p-3 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--success)] flex items-center gap-1">
              <Zap className="h-3 w-3" />
              G.ai took action
            </p>
            {undoStillOpen && undoState !== 'done' && (
              <button
                type="button"
                onClick={() => void runUndo()}
                disabled={undoState === 'pending'}
                className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--danger)] px-1.5 py-0.5 rounded-md transition-colors disabled:opacity-50"
              >
                {undoState === 'pending' ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Undo2 className="h-3 w-3" />
                )}
                Undo
              </button>
            )}
            {undoState === 'done' && (
              <span className="text-[11px] text-[var(--text-subtle)]">Undone</span>
            )}
          </div>
          {(executed ?? []).map((a) => (
            <div key={a.id} className="flex items-start gap-2">
              {a.status === 'failed' ? (
                <AlertCircle className="h-3.5 w-3.5 text-[var(--danger)] mt-0.5 shrink-0" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--success)] mt-0.5 shrink-0" />
              )}
              <p className="text-xs text-[var(--foreground)] leading-relaxed">
                {a.detail || a.label}
              </p>
            </div>
          ))}
          {undoState === 'error' && (
            <p className="text-[11px] text-[var(--danger)]">Undo failed — try again.</p>
          )}
        </div>
      )}

      {/* Proposed actions */}
      {hasProposed && (
        <div className="rounded-lg border border-[var(--accent-blue)]/15 bg-[var(--accent-blue-soft)]/30 p-3 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-blue)]">
            G.ai wants to do this
          </p>
          {(proposed ?? []).map((a) => {
            const st = proposalStates[a.id]?.status ?? 'idle';
            const detail = proposalStates[a.id]?.detail;
            return (
              <div
                key={a.id}
                className="rounded-md bg-[var(--surface)] border border-[var(--border-soft)] p-2.5"
              >
                <p className="text-xs font-semibold text-[var(--foreground)]">{a.label}</p>
                {a.tier === 'sensitive' && st === 'idle' && (
                  <p className="text-[10px] text-[var(--warning)] mt-0.5">Higher-impact action</p>
                )}

                {st === 'confirmed' && (
                  <p className="mt-1.5 text-[11px] text-[var(--success)] flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    {detail || 'Done.'}
                  </p>
                )}
                {st === 'declined' && (
                  <p className="mt-1.5 text-[11px] text-[var(--text-subtle)]">Dismissed.</p>
                )}
                {st === 'error' && (
                  <p className="mt-1.5 text-[11px] text-[var(--danger)]">{detail || 'Failed.'}</p>
                )}

                {(st === 'idle' || st === 'pending' || st === 'error') && (
                  <div className="flex gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => void resolveProposal(a, false)}
                      disabled={st === 'pending'}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-white bg-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/90 px-2.5 py-1 rounded-md transition-colors disabled:opacity-50"
                    >
                      {st === 'pending' ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => void resolveProposal(a, true)}
                      disabled={st === 'pending'}
                      className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--foreground)] px-2 py-1 rounded-md border border-[var(--border-soft)] transition-colors disabled:opacity-50"
                    >
                      <X className="h-3 w-3" />
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

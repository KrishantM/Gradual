'use client';

/**
 * AutonomySelector — lets the user set how much G.ai's agent may do on its own.
 *
 * Reads/writes users/{uid}.gaiAutonomy via /api/copilot/settings. New users
 * default to `full_auto`.
 *
 * - compact:  a 3-segment pill, for tight headers (the Paths-side pane).
 * - default:  3 labelled option rows, for the Copilot right control pane.
 */

import { useCallback, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { Zap, ShieldCheck, MessageSquare, Loader2 } from 'lucide-react';
import type { GaiAutonomy } from '@/lib/copilot/autonomy';

interface AutonomySelectorProps {
  user: User;
  compact?: boolean;
  /** Notified after a successful change — lets parents react to mode switches. */
  onChange?: (autonomy: GaiAutonomy) => void;
}

const OPTIONS: { value: GaiAutonomy; label: string; icon: typeof Zap; description: string }[] = [
  { value: 'full_auto', label: 'Full Auto', icon: Zap, description: 'G.ai takes actions for you. Undo anytime.' },
  { value: 'confirm', label: 'Confirm', icon: ShieldCheck, description: 'G.ai asks before it acts on anything.' },
  { value: 'manual', label: 'Manual', icon: MessageSquare, description: 'G.ai only answers and suggests — never acts.' },
];

export function AutonomySelector({ user, compact = false, onChange }: AutonomySelectorProps) {
  const [autonomy, setAutonomy] = useState<GaiAutonomy | null>(null);
  const [usage, setUsage] = useState<{ used: number; remaining: number; max: number } | null>(null);
  const [saving, setSaving] = useState<GaiAutonomy | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/copilot/settings', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (!cancelled) setAutonomy('full_auto');
          return;
        }
        const data = (await res.json()) as {
          autonomy: GaiAutonomy;
          usage?: { used: number; remaining: number; max: number };
        };
        if (!cancelled) {
          setAutonomy(data.autonomy);
          setUsage(data.usage ?? null);
        }
      } catch {
        if (!cancelled) setAutonomy('full_auto');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const select = useCallback(
    async (next: GaiAutonomy) => {
      if (next === autonomy || saving) return;
      const previous = autonomy;
      setAutonomy(next); // optimistic
      setSaving(next);
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/copilot/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ autonomy: next }),
        });
        if (!res.ok) {
          setAutonomy(previous); // revert
          return;
        }
        onChange?.(next);
      } catch {
        setAutonomy(previous);
      } finally {
        setSaving(null);
      }
    },
    [autonomy, saving, user, onChange]
  );

  if (autonomy === null) {
    return (
      <div className="flex items-center gap-2 text-[11px] text-[var(--text-subtle)]">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading G.ai mode…
      </div>
    );
  }

  if (compact) {
    return (
      <div className="inline-flex rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] p-0.5">
        {OPTIONS.map((opt) => {
          const active = opt.value === autonomy;
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => void select(opt.value)}
              title={opt.description}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                active
                  ? 'bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]'
                  : 'text-[var(--text-subtle)] hover:text-[var(--foreground)]'
              }`}
            >
              {saving === opt.value ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Icon className="h-3 w-3" />
              )}
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)]">
          G.ai autonomy
        </p>
        {usage && (
          <span className="text-[10px] text-[var(--text-subtle)]">
            {usage.remaining}/{usage.max} left today
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        {OPTIONS.map((opt) => {
          const active = opt.value === autonomy;
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => void select(opt.value)}
              className={`w-full text-left rounded-lg border p-2.5 transition-all ${
                active
                  ? 'border-[var(--accent-blue)]/40 bg-[var(--accent-blue-soft)]/40'
                  : 'border-[var(--border-soft)] hover:border-[var(--border)] bg-[var(--surface)]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon
                  className={`h-3.5 w-3.5 shrink-0 ${
                    active ? 'text-[var(--accent-blue)]' : 'text-[var(--text-subtle)]'
                  }`}
                />
                <span
                  className={`text-xs font-semibold ${
                    active ? 'text-[var(--foreground)]' : 'text-[var(--text-muted)]'
                  }`}
                >
                  {opt.label}
                </span>
                {saving === opt.value && (
                  <Loader2 className="h-3 w-3 animate-spin text-[var(--text-subtle)] ml-auto" />
                )}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-relaxed pl-[22px]">
                {opt.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

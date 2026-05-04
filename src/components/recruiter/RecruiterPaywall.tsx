'use client';

/**
 * RecruiterPaywall — premium locked state for non-access users.
 *
 * Three jobs:
 *   1. Communicate the value of Gradual's recruiter platform.
 *   2. Set commercial expectations (this is paid / partner access).
 *   3. Provide a clear next action: Request access.
 *
 * Visual: Uses Gradual's design tokens — no hardcoded slate/blue gradients,
 * no `bg-white/5`. Lives inside the same shell as the rest of the app.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Lock,
  Sparkles,
  ShieldCheck,
  Users,
  TrendingUp,
  Mail,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RecruiterAccessRequestModal } from './RecruiterAccessRequestModal';

interface RecruiterPaywallProps {
  /** Used in the mailto link so partner inquiries are easy to triage. */
  email?: string | null;
  /** From the access check — hints at what state to nudge towards. */
  reason?:
    | 'demo_bypass'
    | 'subscription_active'
    | 'no_profile'
    | 'profile_incomplete'
    | 'subscription_inactive'
    | 'unauthenticated';
}

const VALUE_PROPS = [
  {
    icon: Users,
    title: 'Curated talent discovery',
    body: 'Browse pre-vetted students and early professionals who have built career momentum on Gradual — not just an open job board.',
  },
  {
    icon: TrendingUp,
    title: 'Signal-driven shortlists',
    body: 'Filter by CV strength, readiness, and high-level interests. Privacy-conscious previews mean fewer cold reaches, higher response rates.',
  },
  {
    icon: ShieldCheck,
    title: 'Compliant by default',
    body: 'Gradual mediates contact. You never see private details until candidates opt in — protects both sides and clears most GDPR/Privacy Act friction.',
  },
];

export function RecruiterPaywall({ email, reason }: RecruiterPaywallProps) {
  const router = useRouter();
  const [requestOpen, setRequestOpen] = useState(false);

  const ctaLabel =
    reason === 'subscription_inactive'
      ? 'Reactivate recruiter access'
      : 'Request recruiter access';

  return (
    <div className="page-container">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        {/* ─── Hero ─── */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--accent-blue-soft)] mb-5"
          >
            <Lock className="w-7 h-7 text-[var(--accent-blue)]" />
          </motion.div>
          <div className="badge badge-blue mx-auto mb-4">
            <Sparkles className="w-3 h-3" />
            Partner platform · Beta
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 text-[var(--foreground)]">
            Recruiter access is part of Gradual&apos;s partner platform
          </h1>
          <p className="text-base sm:text-lg text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
            Gradual&apos;s recruiter side connects you with students and early
            professionals who&apos;ve built real career momentum — not just
            another searchable database. Access is invite-only while we
            partner with select organisations.
          </p>
        </div>

        {/* ─── Value prop cards ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="grid sm:grid-cols-3 gap-4 mb-10"
        >
          {VALUE_PROPS.map((prop) => {
            const Icon = prop.icon;
            return (
              <Card key={prop.title} className="hover-lift h-full">
                <CardContent className="p-5">
                  <div className="rounded-lg bg-[var(--accent-blue-soft)] p-2 w-9 h-9 flex items-center justify-center mb-3">
                    <Icon className="w-4 h-4 text-[var(--accent-blue)]" />
                  </div>
                  <h3 className="text-sm font-semibold mb-1.5 text-[var(--foreground)]">
                    {prop.title}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    {prop.body}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>

        {/* ─── Teaser preview (blurred) ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="relative mb-10"
        >
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)] mb-3 text-center">
            Preview · Recruiter discovery
          </div>
          <div className="relative rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] overflow-hidden">
            <div
              aria-hidden
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 p-5 select-none pointer-events-none"
              style={{ filter: 'blur(6px)' }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface-subtle)] p-4"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-[var(--accent-blue-soft)]" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-3/4 rounded bg-[var(--border)]" />
                      <div className="h-2.5 w-1/2 rounded bg-[var(--border-soft)]" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-2 w-full rounded bg-[var(--border-soft)]" />
                    <div className="h-2 w-5/6 rounded bg-[var(--border-soft)]" />
                  </div>
                </div>
              ))}
            </div>

            {/* Lock overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-[var(--surface)]/80 to-[var(--surface)]">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)] shadow-md mb-3">
                  <Lock className="w-5 h-5 text-[var(--text-muted)]" />
                </div>
                <p className="text-sm text-[var(--text-muted)] font-medium">
                  Candidate previews unlock with partner access
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── CTA ─── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="rounded-xl border border-[var(--accent-blue)]/20 bg-[var(--accent-blue-soft)]/40 p-6 sm:p-8 text-center"
        >
          <h2 className="text-xl font-semibold mb-2 text-[var(--foreground)]">
            Interested in partnering with Gradual?
          </h2>
          <p className="text-sm text-[var(--text-muted)] mb-5 max-w-xl mx-auto">
            Tell us about your hiring goals and we&apos;ll be in touch within
            two business days. We work with universities, accelerator programs,
            and a small set of employer partners during the beta.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 justify-center items-center">
            <Button
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => setRequestOpen(true)}
            >
              <Mail className="w-4 h-4 mr-2" />
              {ctaLabel}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => router.push('/dashboard')}
            >
              Back to Gradual
            </Button>
          </div>
          {email && (
            <p className="text-[11px] text-[var(--text-subtle)] mt-4">
              Signed in as {email}
            </p>
          )}
        </motion.div>
      </motion.div>

      <RecruiterAccessRequestModal
        open={requestOpen}
        onOpenChange={setRequestOpen}
        defaultEmail={email}
      />
    </div>
  );
}

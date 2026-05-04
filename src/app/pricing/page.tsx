'use client';

/**
 * Pricing — Student subscription tiers.
 *
 * Three tiers:
 *   Free        — core access (CV scoring, planner, basic Copilot, browse paths)
 *   Plus        $9 NZD/mo — unlimited G.AI Copilot, unlimited Paths, advanced CV
 *   Pro         $19 NZD/mo — everything in Plus + Micro-certifications, recruiter
 *               outreach, direct University Clubs contact
 *
 * Layout: Free (left) → Plus (middle, highlighted) → Pro (right). Premium feel
 * using design tokens — no hardcoded slate/white classes.
 */

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Check,
  Sparkles,
  Crown,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Brain,
  Award,
  Briefcase,
  Users2,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

interface Tier {
  id: 'free' | 'plus' | 'pro';
  name: string;
  price: string;
  priceNote: string;
  tagline: string;
  description: string;
  icon: typeof Sparkles;
  highlight: boolean;
  ctaLabel: string;
  ctaHref: string;
  features: string[];
  premiumFeatures?: string[];
}

const TIERS: Tier[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    priceNote: 'forever',
    tagline: 'Get started with the essentials',
    description: 'The full Gradual core experience — enough to find direction and start moving.',
    icon: GraduationCap,
    highlight: false,
    ctaLabel: 'Start free',
    ctaHref: '/register',
    features: [
      'CV upload + baseline score',
      'Profile, Planner & ToDo list',
      'Browse & enrol in 1 capability path at a time',
      'Daily G.AI Copilot — up to 10 messages/day',
      'Curated opportunities feed',
      'Dashboard career signals',
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    price: '$9',
    priceNote: 'NZD / month',
    tagline: 'Go deeper, faster',
    description: 'Unlimited G.AI Copilot and capability paths — for when one a day isn\'t enough.',
    icon: Sparkles,
    highlight: true,
    ctaLabel: 'Upgrade to Plus',
    ctaHref: '/register?plan=plus',
    features: [
      'Everything in Free, plus:',
    ],
    premiumFeatures: [
      'Unlimited G.AI Copilot conversations',
      'Unlimited capability path enrolments',
      'Custom AI-generated learning pathways',
      'Advanced CV scoring + AI rewrites',
      'Priority opportunity matching',
      'Saved Copilot history with search',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$19',
    priceNote: 'NZD / month',
    tagline: 'Career acceleration',
    description: 'For students serious about landing the role. Includes everything in Plus.',
    icon: Crown,
    highlight: false,
    ctaLabel: 'Upgrade to Pro',
    ctaHref: '/register?plan=pro',
    features: [
      'Everything in Plus, plus:',
    ],
    premiumFeatures: [
      'Gradual Micro-certifications',
      'Recruiter outreach opportunities',
      'Direct contact with University Clubs',
      'Verified profile badge for recruiters',
      'Early access to new pathways & features',
      'Priority support',
    ],
  },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Can I change plans anytime?',
    a: 'Yes. Upgrade or downgrade at any time — changes take effect immediately and we prorate the difference.',
  },
  {
    q: 'Is there a free trial of Plus or Pro?',
    a: 'Plus and Pro both include a 7-day free trial. No credit card required to start.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'All major credit and debit cards, with NZD billing. Bank transfer is available for annual plans on request.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel anytime with no fees — you keep access until the end of the current billing period.',
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <div className="page-container">
        {/* ─── Back ─── */}
        {user && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to dashboard
          </Button>
        )}

        {/* ─── Hero ─── */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-14"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-1.5 mb-5">
            <Sparkles className="h-3.5 w-3.5 text-[var(--accent-blue)]" />
            <span className="text-xs font-medium text-[var(--text-muted)]">
              Simple, transparent pricing — NZD
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
            Pick the plan that grows with you
          </h1>
          <p className="text-base sm:text-lg text-[var(--text-muted)] leading-relaxed">
            Start free. Upgrade when you want unlimited AI, custom learning, and direct
            recruiter access. Every plan keeps your data, your CV, and your progress.
          </p>
        </motion.div>

        {/* ─── Tier cards ─── */}
        <div className="grid lg:grid-cols-3 gap-5 lg:gap-6 max-w-6xl mx-auto mb-16">
          {TIERS.map((tier, idx) => (
            <TierCard key={tier.id} tier={tier} delay={0.05 + idx * 0.08} />
          ))}
        </div>

        {/* ─── Comparison teaser ─── */}
        <motion.div
          className="max-w-5xl mx-auto mb-16"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
              What you unlock as you go
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Each tier builds on the last — nothing is taken away when you upgrade.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <FeatureHighlight
              icon={Brain}
              title="G.AI Copilot"
              free="10 messages/day"
              plus="Unlimited"
              pro="Unlimited + priority"
            />
            <FeatureHighlight
              icon={Zap}
              title="Capability paths"
              free="1 active enrolment"
              plus="Unlimited"
              pro="Unlimited + early access"
            />
            <FeatureHighlight
              icon={Award}
              title="Micro-certifications"
              free="—"
              plus="—"
              pro="Included"
              isPro
            />
            <FeatureHighlight
              icon={Briefcase}
              title="Recruiter outreach"
              free="—"
              plus="—"
              pro="Direct opportunities"
              isPro
            />
            <FeatureHighlight
              icon={Users2}
              title="University Clubs contact"
              free="—"
              plus="—"
              pro="Direct connection"
              isPro
            />
            <FeatureHighlight
              icon={Sparkles}
              title="CV scoring"
              free="Baseline score"
              plus="Advanced + AI rewrites"
              pro="Advanced + AI rewrites"
            />
          </div>
        </motion.div>

        {/* ─── FAQ ─── */}
        <motion.div
          className="max-w-3xl mx-auto mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <h2 className="text-2xl font-semibold text-center text-[var(--foreground)] mb-8">
            Common questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <div
                key={faq.q}
                className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-card)] p-5"
              >
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1.5">
                  {faq.q}
                </h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ─── Closing CTA ─── */}
        <motion.div
          className="max-w-3xl mx-auto rounded-2xl border border-[var(--accent-blue)]/20 bg-[var(--accent-blue-soft)]/40 p-8 sm:p-10 text-center"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-3">
            Still figuring it out?
          </h2>
          <p className="text-sm text-[var(--text-muted)] mb-6 max-w-xl mx-auto">
            Start free — you don&apos;t need to decide today. The Free tier gives you
            everything you need to find direction and build momentum.
          </p>
          <Button
            size="lg"
            onClick={() => router.push(user ? '/dashboard' : '/register')}
          >
            {user ? 'Back to my dashboard' : 'Start for free'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

function TierCard({ tier, delay }: { tier: Tier; delay: number }) {
  const router = useRouter();
  const Icon = tier.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`relative rounded-2xl border p-6 sm:p-7 flex flex-col ${
        tier.highlight
          ? 'border-[var(--accent-blue)] bg-[var(--surface-card)] shadow-[var(--shadow-lg)] lg:scale-[1.02]'
          : 'border-[var(--border-soft)] bg-[var(--surface-card)]'
      }`}
    >
      {tier.highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-blue)] px-3 py-1 text-[11px] font-semibold text-white shadow-[var(--shadow-sm)]">
            <Sparkles className="h-3 w-3" />
            Most popular
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-5">
        <div
          className={`inline-flex items-center justify-center w-11 h-11 rounded-xl mb-4 ${
            tier.id === 'pro'
              ? 'bg-[var(--accent-purple-soft,var(--accent-blue-soft))] text-[var(--accent-purple,var(--accent-blue))]'
              : 'bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]'
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-xl font-semibold text-[var(--foreground)] mb-1">
          {tier.name}
        </h3>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">{tier.tagline}</p>
      </div>

      {/* Price */}
      <div className="mb-6 pb-6 border-b border-[var(--border-soft)]">
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl font-bold text-[var(--foreground)] tracking-tight">
            {tier.price}
          </span>
          <span className="text-sm text-[var(--text-muted)]">{tier.priceNote}</span>
        </div>
        <p className="text-xs text-[var(--text-subtle)] mt-2 leading-relaxed">
          {tier.description}
        </p>
      </div>

      {/* Features */}
      <ul className="space-y-2.5 mb-6 flex-1">
        {tier.features.map((feat) => (
          <li key={feat} className="flex items-start gap-2.5">
            <Check className="h-4 w-4 text-[var(--success)] mt-0.5 shrink-0" />
            <span
              className={`text-sm leading-relaxed ${
                feat.endsWith('plus:')
                  ? 'font-semibold text-[var(--foreground)]'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              {feat}
            </span>
          </li>
        ))}
        {tier.premiumFeatures?.map((feat) => (
          <li key={feat} className="flex items-start gap-2.5">
            <Check
              className={`h-4 w-4 mt-0.5 shrink-0 ${
                tier.id === 'pro'
                  ? 'text-[var(--accent-purple,var(--accent-blue))]'
                  : 'text-[var(--accent-blue)]'
              }`}
            />
            <span className="text-sm text-[var(--foreground)] leading-relaxed">{feat}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Button
        size="lg"
        variant={tier.highlight ? 'default' : 'outline'}
        className="w-full"
        onClick={() => router.push(tier.ctaHref)}
      >
        {tier.ctaLabel}
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
      {tier.id !== 'free' && (
        <p className="text-[11px] text-[var(--text-subtle)] text-center mt-3">
          7-day free trial · Cancel anytime
        </p>
      )}
    </motion.div>
  );
}

function FeatureHighlight({
  icon: Icon,
  title,
  free,
  plus,
  pro,
  isPro,
}: {
  icon: typeof Sparkles;
  title: string;
  free: string;
  plus: string;
  pro: string;
  isPro?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-card)] p-4">
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`rounded-md p-1.5 ${
            isPro
              ? 'bg-[var(--accent-purple-soft,var(--accent-blue-soft))]'
              : 'bg-[var(--accent-blue-soft)]'
          }`}
        >
          <Icon
            className={`h-3.5 w-3.5 ${
              isPro
                ? 'text-[var(--accent-purple,var(--accent-blue))]'
                : 'text-[var(--accent-blue)]'
            }`}
          />
        </div>
        <span className="text-sm font-semibold text-[var(--foreground)]">{title}</span>
      </div>
      <div className="space-y-1.5 text-xs">
        <Row label="Free" value={free} />
        <Row label="Plus" value={plus} />
        <Row label="Pro" value={pro} accent={isPro} />
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[var(--text-subtle)] text-[11px] uppercase tracking-wider font-semibold w-10">
        {label}
      </span>
      <span
        className={`text-right ${
          accent
            ? 'text-[var(--accent-blue)] font-medium'
            : value === '—'
              ? 'text-[var(--text-subtle)]'
              : 'text-[var(--foreground)]'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

'use client';

/**
 * Recruiter Dashboard — Gradual partner platform
 *
 * Privacy & access:
 *   - Calls /api/recruiter/access first. Anything but `hasAccess: true`
 *     renders <RecruiterPaywall>. Demo bypass for krishantm7@gmail.com.
 *   - Candidate data comes from /api/recruiter/students which only returns
 *     RecruiterCandidatePreview (no email, no CV text, no private fields).
 *
 * Visual:
 *   - Uses Gradual design tokens — page-container, hover-lift, badge,
 *     CSS variables. No hardcoded slate/blue gradients.
 *   - Light/dark mode by virtue of CSS variables.
 *   - Mobile: filters collapse, grid stacks 1→2→3 columns.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { createAuthFetcher, SWR_AUTH_CONFIG } from '@/lib/swr-fetcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { RecruiterPaywall } from '@/components/recruiter/RecruiterPaywall';
import { isRecruiterDemoBypassEmail } from '@/lib/recruiter/client-access';
import type { RecruiterCandidatePreview } from '@/lib/recruiter/safe-candidate';
import {
  Search,
  Users,
  Bookmark,
  Mail,
  BarChart3,
  Loader2,
  MapPin,
  GraduationCap,
  Sparkles,
  Crown,
  LogOut,
  User as UserIcon,
  Filter,
  Star,
  Clock,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

interface AccessResponse {
  access: {
    hasAccess: boolean;
    reason:
      | 'demo_bypass'
      | 'subscription_active'
      | 'no_profile'
      | 'profile_incomplete'
      | 'subscription_inactive'
      | 'unauthenticated';
    isDemo: boolean;
  };
  viewer: {
    fullName: string;
    companyName: string;
    jobTitle: string;
    subscriptionTier: string;
  } | null;
  email: string | null;
}

interface CandidatesResponse {
  candidates: RecruiterCandidatePreview[];
  total: number;
  isDemo: boolean;
}

type Tab = 'browse' | 'shortlists' | 'contacts' | 'analytics';

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: 'browse', label: 'Browse', icon: Users },
  { id: 'shortlists', label: 'Shortlists', icon: Bookmark },
  { id: 'contacts', label: 'Contacts', icon: Mail },
  { id: 'analytics', label: 'Insights', icon: BarChart3 },
];

const SCORE_BAND_CLASS = (score: number | null): string => {
  if (score == null) return 'score-fair';
  if (score >= 80) return 'score-excellent';
  if (score >= 65) return 'score-good';
  if (score >= 45) return 'score-fair';
  return 'score-poor';
};

const SCORE_LABEL = (score: number | null): string => {
  if (score == null) return 'Unscored';
  if (score >= 80) return 'Excellent';
  if (score >= 65) return 'Strong';
  if (score >= 45) return 'Developing';
  return 'Early';
};

const RELATIVE_TIME = (iso: string | null): string => {
  if (!iso) return 'Recent';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'Recent';
  const days = Math.max(0, Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24)));
  if (days <= 1) return 'Active today';
  if (days < 7) return `Active ${days}d ago`;
  if (days < 30) return `Active ${Math.floor(days / 7)}w ago`;
  return `Active ${Math.floor(days / 30)}mo ago`;
};

export default function RecruiterDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [cvScoreMin, setCvScoreMin] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [contactStatus, setContactStatus] = useState<{ id: string; status: 'sending' | 'sent' | 'error'; message?: string } | null>(null);

  const fetcher = useMemo(() => (user ? createAuthFetcher(user) : null), [user]);

  const { data: accessData, isLoading: accessLoading } = useSWR<AccessResponse>(
    user ? '/api/recruiter/access' : null,
    fetcher,
    SWR_AUTH_CONFIG
  );

  // Build the candidates URL — embed search/filter params in the cache key
  // so SWR refetches when they change. Skip until we know the user has access.
  const candidatesKey = useMemo(() => {
    if (!user || !accessData?.access.hasAccess) return null;
    const params = new URLSearchParams();
    if (appliedSearch) params.set('q', appliedSearch);
    if (cvScoreMin > 0) params.set('cvScoreMin', String(cvScoreMin));
    return `/api/recruiter/students?${params.toString()}`;
  }, [user, accessData?.access.hasAccess, appliedSearch, cvScoreMin]);

  const candidatesFetcher = useCallback(
    async (key: string) => {
      if (!user) throw new Error('No user');
      const url = new URL(key, window.location.origin);
      const search = url.searchParams.get('q') ?? '';
      const min = Number(url.searchParams.get('cvScoreMin') ?? '0');
      const token = await user.getIdToken();
      const res = await fetch('/api/recruiter/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          search,
          filters: { cvScoreMin: min, cvScoreMax: 100 },
          limit: 24,
        }),
      });
      if (!res.ok) throw new Error('Failed to load candidates');
      return res.json() as Promise<CandidatesResponse>;
    },
    [user]
  );

  const { data: candidatesData, isLoading: candidatesLoading, error: candidatesError, mutate: refetchCandidates } =
    useSWR<CandidatesResponse>(candidatesKey, candidatesFetcher, SWR_AUTH_CONFIG);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  const submitSearch = useCallback(() => {
    setAppliedSearch(searchQuery.trim());
  }, [searchQuery]);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expressInterest = useCallback(
    async (candidateId: string) => {
      if (!user) return;
      setContactStatus({ id: candidateId, status: 'sending' });
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/recruiter/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            studentId: candidateId,
            message: 'A recruiter on Gradual is interested in connecting about opportunities.',
          }),
        });
        if (!res.ok) throw new Error('contact failed');
        setContactStatus({ id: candidateId, status: 'sent' });
        setTimeout(() => setContactStatus(null), 2500);
      } catch {
        setContactStatus({ id: candidateId, status: 'error', message: 'Try again shortly' });
        setTimeout(() => setContactStatus(null), 3000);
      }
    },
    [user]
  );

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (e) {
      console.error('logout failed', e);
    }
  };

  // ─── Auth gate (top-level loading) ───
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-blue)]" />
      </div>
    );
  }

  // Optimistic paywall: if we already know it's not the bypass email and the
  // server hasn't confirmed access yet, hide the page chrome behind a spinner.
  // This prevents a flash of empty dashboard for users without access.
  const isLikelyBypass = isRecruiterDemoBypassEmail(user.email);
  const accessReady = accessData != null;

  if (accessLoading && !accessReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-blue)]" />
      </div>
    );
  }

  // ─── Paywall ───
  if (accessReady && !accessData!.access.hasAccess) {
    return <RecruiterPaywall email={accessData!.email ?? user.email} reason={accessData!.access.reason} />;
  }

  // From here: hasAccess is true (demo or paid).
  const viewer = accessData?.viewer ?? null;
  const isDemo = accessData?.access.isDemo ?? isLikelyBypass;
  const candidates = candidatesData?.candidates ?? [];

  return (
    <div className="min-h-screen">
      {/* ─── Header ─── */}
      <header className="border-b border-[var(--border-soft)] bg-[var(--surface)] sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-[var(--surface)]/85">
        <div className="page-container !py-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="rounded-xl bg-[var(--accent-blue-soft)] p-2.5">
                <Crown className="h-5 w-5 text-[var(--accent-blue)]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-semibold tracking-tight truncate">
                    Recruiter Workspace
                  </h1>
                  {isDemo && (
                    <span className="badge badge-blue text-[10px] uppercase tracking-wider">
                      <Sparkles className="w-3 h-3" />
                      Demo access
                    </span>
                  )}
                </div>
                {viewer && (
                  <p className="text-xs text-[var(--text-muted)] truncate">
                    {viewer.fullName}
                    {viewer.companyName && ` · ${viewer.companyName}`}
                    {viewer.jobTitle && ` · ${viewer.jobTitle}`}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/recruiter-profile')}
                className="hidden sm:inline-flex"
              >
                <UserIcon className="w-4 h-4 mr-1.5" />
                Profile
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Tabs ─── */}
      <div className="page-container !py-0">
        <div className="overflow-x-auto -mx-1 px-1 mt-4">
          <div className="tab-nav inline-flex min-w-full sm:min-w-0">
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`tab-nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Main ─── */}
      <main className="page-container">
        {activeTab === 'browse' && (
          <BrowseTab
            candidates={candidates}
            isLoading={candidatesLoading}
            hasError={Boolean(candidatesError)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchSubmit={submitSearch}
            cvScoreMin={cvScoreMin}
            onCvScoreMinChange={setCvScoreMin}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters((p) => !p)}
            selected={selected}
            onToggleSelect={toggleSelect}
            onContact={expressInterest}
            contactStatus={contactStatus}
            onResetFilters={() => {
              setSearchQuery('');
              setAppliedSearch('');
              setCvScoreMin(0);
              refetchCandidates();
            }}
            isDemo={isDemo}
          />
        )}

        {activeTab === 'shortlists' && (
          <ComingSoonPanel
            icon={Bookmark}
            title="Shortlists"
            description="Save groups of candidates for follow-up. Selection from Browse will roll into named lists here."
            ctaLabel="Browse candidates"
            onCta={() => setActiveTab('browse')}
          />
        )}

        {activeTab === 'contacts' && (
          <ComingSoonPanel
            icon={Mail}
            title="Contact history"
            description="Recruiter-to-candidate messages route through Gradual. Once a candidate accepts, the conversation appears here."
            ctaLabel="Browse candidates"
            onCta={() => setActiveTab('browse')}
          />
        )}

        {activeTab === 'analytics' && (
          <ComingSoonPanel
            icon={BarChart3}
            title="Hiring insights"
            description="Trends across your shortlists, response rates, and candidate readiness will live here once you've made contact."
            ctaLabel="Browse candidates"
            onCta={() => setActiveTab('browse')}
          />
        )}
      </main>
    </div>
  );
}

/* ─── Browse Tab ─── */

function BrowseTab(props: {
  candidates: RecruiterCandidatePreview[];
  isLoading: boolean;
  hasError: boolean;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onSearchSubmit: () => void;
  cvScoreMin: number;
  onCvScoreMinChange: (n: number) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onContact: (id: string) => void;
  contactStatus: { id: string; status: 'sending' | 'sent' | 'error'; message?: string } | null;
  onResetFilters: () => void;
  isDemo: boolean;
}) {
  const {
    candidates,
    isLoading,
    hasError,
    searchQuery,
    onSearchChange,
    onSearchSubmit,
    cvScoreMin,
    onCvScoreMinChange,
    showFilters,
    onToggleFilters,
    selected,
    onToggleSelect,
    onContact,
    contactStatus,
    onResetFilters,
    isDemo,
  } = props;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Privacy banner */}
      <div className="flex items-start gap-2.5 rounded-lg border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-4 py-3">
        <ShieldCheck className="w-4 h-4 text-[var(--accent-blue)] shrink-0 mt-0.5" />
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          You&apos;re seeing privacy-safe previews. Candidate emails, CVs, and private profile
          details are never shared — Gradual mediates introductions only after candidates opt in.
        </p>
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-subtle)]" />
          <Input
            placeholder="Search by skill, study area, region, interest…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearchSubmit();
            }}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={onSearchSubmit} className="flex-1 sm:flex-none">
            <Search className="w-4 h-4 mr-1.5" />
            Search
          </Button>
          <Button variant="outline" onClick={onToggleFilters} className="flex-1 sm:flex-none">
            <Filter className="w-4 h-4 mr-1.5" />
            Filters
          </Button>
        </div>
      </div>

      {/* Filter panel (collapsible) */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface)] p-4 sm:p-5"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-2">
                Minimum CV score
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={90}
                  step={5}
                  value={cvScoreMin}
                  onChange={(e) => onCvScoreMinChange(Number(e.target.value))}
                  className="flex-1 accent-[var(--accent-blue)]"
                />
                <span className="text-sm font-semibold tabular-nums w-10 text-right">
                  {cvScoreMin}
                </span>
              </div>
            </div>
            <div className="flex items-end">
              <Button variant="outline" size="sm" onClick={onResetFilters} className="ml-auto">
                Reset filters
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Results meta */}
      {!isLoading && !hasError && (
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>
            {candidates.length} candidate{candidates.length === 1 ? '' : 's'} matched
          </span>
          {selected.size > 0 && (
            <span className="badge badge-blue">
              {selected.size} selected
            </span>
          )}
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CandidateSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {hasError && !isLoading && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-[var(--danger)]">Couldn&apos;t load candidates. Try again?</p>
          </CardContent>
        </Card>
      )}

      {/* Empty */}
      {!isLoading && !hasError && candidates.length === 0 && (
        <div className="empty-state">
          <Users className="empty-state-icon" />
          <p className="font-medium text-[var(--foreground)]">No candidates match those filters</p>
          <p className="text-sm">Try broadening your search or lowering the CV score floor.</p>
          <Button variant="outline" size="sm" onClick={onResetFilters} className="mt-4">
            Reset filters
          </Button>
        </div>
      )}

      {/* Grid */}
      {!isLoading && !hasError && candidates.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidates.map((c) => (
            <CandidateCard
              key={c.id}
              candidate={c}
              isSelected={selected.has(c.id)}
              onToggleSelect={() => onToggleSelect(c.id)}
              onContact={() => onContact(c.id)}
              contactStatus={contactStatus?.id === c.id ? contactStatus.status : null}
            />
          ))}
        </div>
      )}

      {isDemo && candidates.length > 0 && (
        <p className="text-[10px] text-center text-[var(--text-subtle)] mt-2">
          Demo bypass · candidate data is privacy-filtered, real Gradual users
        </p>
      )}
    </motion.div>
  );
}

/* ─── Candidate Card ─── */

function CandidateCard(props: {
  candidate: RecruiterCandidatePreview;
  isSelected: boolean;
  onToggleSelect: () => void;
  onContact: () => void;
  contactStatus: 'sending' | 'sent' | 'error' | null;
}) {
  const { candidate: c, isSelected, onToggleSelect, onContact, contactStatus } = props;
  const scoreClass = SCORE_BAND_CLASS(c.cvScore);
  const scoreLabel = SCORE_LABEL(c.cvScore);

  return (
    <Card className={`hover-lift h-full ${isSelected ? 'ring-2 ring-[var(--accent-blue)]/50' : ''}`}>
      <CardContent className="p-5 flex flex-col h-full">
        {/* Top row: avatar, name, score */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-[var(--accent-blue-soft)] flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-[var(--accent-blue)] tabular-nums">
              {c.initials}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold truncate text-[var(--foreground)]">
              {c.displayName}
            </h3>
            {c.studyArea && (
              <p className="text-[11px] text-[var(--text-muted)] truncate flex items-center gap-1">
                <GraduationCap className="w-3 h-3 shrink-0" />
                {c.studyArea}
              </p>
            )}
          </div>
          <div
            className={`flex flex-col items-center justify-center rounded-lg border px-2 py-1 ${scoreClass} score-bg-${scoreClass.replace('score-', '')}`}
            title={`CV score: ${scoreLabel}`}
          >
            <span className="text-[9px] uppercase tracking-wider font-semibold opacity-80">
              CV
            </span>
            <span className="text-sm font-bold tabular-nums leading-none">
              {c.cvScore ?? '—'}
            </span>
          </div>
        </div>

        {/* Headline */}
        {c.headline && (
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3 line-clamp-2">
            {c.headline}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--text-muted)] mb-3">
          {c.region && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0" />
              {c.region}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3 shrink-0" />
            {RELATIVE_TIME(c.lastActiveISO)}
          </span>
          {c.readiness != null && (
            <span className="inline-flex items-center gap-1">
              <Star className="w-3 h-3 shrink-0 text-[var(--accent-blue)]" />
              {c.readiness}% ready
            </span>
          )}
        </div>

        {/* Skill tags */}
        {(c.skills.length > 0 || c.interests.length > 0) && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {c.skills.slice(0, 4).map((s) => (
              <span
                key={`skill-${s}`}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-soft)]"
              >
                {s}
              </span>
            ))}
            {c.interests.slice(0, 2).map((i) => (
              <span
                key={`int-${i}`}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] border border-[var(--accent-blue)]/20"
              >
                {i}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleSelect}
            className={`flex-1 ${isSelected ? '!border-[var(--accent-blue)] !text-[var(--accent-blue)]' : ''}`}
          >
            <Bookmark className={`w-3.5 h-3.5 mr-1.5 ${isSelected ? 'fill-current' : ''}`} />
            {isSelected ? 'Saved' : 'Shortlist'}
          </Button>
          <Button
            size="sm"
            onClick={onContact}
            disabled={contactStatus === 'sending' || contactStatus === 'sent'}
            className="flex-1"
          >
            {contactStatus === 'sending' && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            {contactStatus === 'sent' && <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />}
            {contactStatus !== 'sending' && contactStatus !== 'sent' && (
              <Mail className="w-3.5 h-3.5 mr-1.5" />
            )}
            {contactStatus === 'sending'
              ? 'Sending'
              : contactStatus === 'sent'
              ? 'Sent'
              : contactStatus === 'error'
              ? 'Retry'
              : 'Connect'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CandidateSkeleton() {
  return (
    <Card className="h-full">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-[var(--surface-subtle)] animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-3/4 rounded bg-[var(--surface-subtle)] animate-pulse" />
            <div className="h-2 w-1/2 rounded bg-[var(--surface-subtle)] animate-pulse" />
          </div>
          <div className="w-12 h-12 rounded-lg bg-[var(--surface-subtle)] animate-pulse" />
        </div>
        <div className="space-y-1.5 mb-3">
          <div className="h-2 w-full rounded bg-[var(--surface-subtle)] animate-pulse" />
          <div className="h-2 w-5/6 rounded bg-[var(--surface-subtle)] animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 flex-1 rounded bg-[var(--surface-subtle)] animate-pulse" />
          <div className="h-8 flex-1 rounded bg-[var(--surface-subtle)] animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Coming Soon Panel ─── */

function ComingSoonPanel(props: {
  icon: typeof Users;
  title: string;
  description: string;
  ctaLabel: string;
  onCta: () => void;
}) {
  const { icon: Icon, title, description, ctaLabel, onCta } = props;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardContent className="p-8 sm:p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--accent-blue-soft)] mb-4">
            <Icon className="w-5 h-5 text-[var(--accent-blue)]" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-[var(--foreground)]">{title}</h3>
          <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto mb-5 leading-relaxed">
            {description}
          </p>
          <span className="badge badge-blue mx-auto mb-5">
            <Sparkles className="w-3 h-3" />
            Coming next
          </span>
          <div>
            <Button variant="outline" size="sm" onClick={onCta}>
              {ctaLabel}
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

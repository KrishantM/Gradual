'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Edit3,
  Copy,
  Check,
  Download,
  RefreshCw,
  Loader2,
  TrendingUp,
  Star,
  Mail,
  Phone,
  MapPin,
  Link as LinkIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import CVScoreDisplay, { CVScoreData } from './CVScoreDisplay';

export interface RewriteHeader {
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  links?: { label: string; url?: string }[];
}

export interface RewriteExperience {
  role: string;
  organization: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  bullets: string[];
}

export interface RewriteEducation {
  qualification: string;
  institution: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  details?: string[];
}

export interface RewriteProject {
  name: string;
  role?: string;
  bullets: string[];
}

export interface StructuredCV {
  header: RewriteHeader;
  summary: string;
  experience: RewriteExperience[];
  education: RewriteEducation[];
  skills: { category: string; items: string[] }[];
  projects?: RewriteProject[];
  certifications?: string[];
  awards?: string[];
}

export interface CVRewriteResult {
  structured?: StructuredCV;
  plainText?: string;
  changesMade?: string[];
  improvementSummary?: string;
  // Legacy shape — keeps old callers working
  sections?: {
    rewrittenCV?: string;
    changesMade?: string;
    improvementSummary?: string;
  };
}

interface CVRewriteDisplayProps {
  rewriteResult: CVRewriteResult;
  onScoreRewritten: () => void;
  isScoringRewritten: boolean;
  newScoreData?: CVScoreData | null;
}

function dateRange(start?: string, end?: string): string {
  if (!start && !end) return '';
  if (start && end) return `${start} – ${end}`;
  return start || end || '';
}

function CVHeader({ header }: { header: RewriteHeader }) {
  const contactBits = [
    header.email && { icon: Mail, value: header.email },
    header.phone && { icon: Phone, value: header.phone },
    header.location && { icon: MapPin, value: header.location },
  ].filter(Boolean) as { icon: typeof Mail; value: string }[];

  return (
    <div className="text-center pb-6 mb-6 border-b" style={{ borderColor: 'var(--border-soft)' }}>
      {header.name && (
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">{header.name}</h2>
      )}
      {header.title && (
        <p className="mt-1 text-base text-[var(--accent-blue)] font-medium">{header.title}</p>
      )}
      {(contactBits.length > 0 || (header.links && header.links.length > 0)) && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-[var(--text-muted)]">
          {contactBits.map(({ icon: Icon, value }) => (
            <span key={value} className="inline-flex items-center gap-1.5">
              <Icon className="h-3 w-3" /> {value}
            </span>
          ))}
          {header.links?.map((l) => (
            <span key={`${l.label}-${l.url}`} className="inline-flex items-center gap-1.5">
              <LinkIcon className="h-3 w-3" />
              {l.url ? (
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--accent-blue)] transition-colors underline-offset-2 hover:underline"
                >
                  {l.label}
                </a>
              ) : (
                l.label
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 last:mb-0">
      <h3 className="text-xs font-semibold tracking-widest uppercase text-[var(--accent-blue)] mb-3 pb-1.5 border-b"
        style={{ borderColor: 'color-mix(in srgb, var(--accent-blue) 25%, transparent)' }}
      >
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function StructuredCVRender({ cv }: { cv: StructuredCV }) {
  return (
    <div
      className="rounded-xl p-6 sm:p-8"
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border-soft)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <CVHeader header={cv.header} />

      {cv.summary && (
        <Section title="Professional Summary">
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{cv.summary}</p>
        </Section>
      )}

      {cv.experience.length > 0 && (
        <Section title="Experience">
          {cv.experience.map((e, i) => (
            <div key={`${e.role}-${i}`}>
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-[var(--foreground)]">{e.role}</h4>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {e.organization}
                    {e.location ? ` · ${e.location}` : ''}
                  </p>
                </div>
                {dateRange(e.startDate, e.endDate) && (
                  <span className="text-xs text-[var(--text-muted)] tabular-nums shrink-0">
                    {dateRange(e.startDate, e.endDate)}
                  </span>
                )}
              </div>
              {e.bullets.length > 0 && (
                <ul className="mt-2 space-y-1.5 list-none">
                  {e.bullets.map((b, j) => (
                    <li key={j} className="text-sm text-[var(--text-secondary)] leading-relaxed flex gap-2">
                      <span className="text-[var(--accent-blue)] shrink-0">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </Section>
      )}

      {cv.education.length > 0 && (
        <Section title="Education">
          {cv.education.map((e, i) => (
            <div key={`${e.qualification}-${i}`}>
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-[var(--foreground)]">{e.qualification}</h4>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {e.institution}
                    {e.location ? ` · ${e.location}` : ''}
                  </p>
                </div>
                {dateRange(e.startDate, e.endDate) && (
                  <span className="text-xs text-[var(--text-muted)] tabular-nums shrink-0">
                    {dateRange(e.startDate, e.endDate)}
                  </span>
                )}
              </div>
              {e.details && e.details.length > 0 && (
                <ul className="mt-2 space-y-1 list-none">
                  {e.details.map((d, j) => (
                    <li key={j} className="text-sm text-[var(--text-secondary)] leading-relaxed flex gap-2">
                      <span className="text-[var(--accent-blue)] shrink-0">•</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </Section>
      )}

      {cv.skills.length > 0 && (
        <Section title="Skills">
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
            {cv.skills.map((g) => (
              <div key={g.category}>
                <p className="text-xs font-semibold text-[var(--foreground)] mb-1.5">{g.category}</p>
                <div className="flex flex-wrap gap-1.5">
                  {g.items.map((item) => (
                    <span
                      key={item}
                      className="px-2 py-0.5 text-xs rounded-md"
                      style={{
                        backgroundColor: 'var(--surface-subtle)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-soft)',
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {cv.projects && cv.projects.length > 0 && (
        <Section title="Projects">
          {cv.projects.map((p, i) => (
            <div key={`${p.name}-${i}`}>
              <h4 className="text-sm font-semibold text-[var(--foreground)]">
                {p.name}
                {p.role ? <span className="font-normal text-[var(--text-secondary)]"> — {p.role}</span> : null}
              </h4>
              {p.bullets.length > 0 && (
                <ul className="mt-2 space-y-1.5 list-none">
                  {p.bullets.map((b, j) => (
                    <li key={j} className="text-sm text-[var(--text-secondary)] leading-relaxed flex gap-2">
                      <span className="text-[var(--accent-blue)] shrink-0">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </Section>
      )}

      {cv.certifications && cv.certifications.length > 0 && (
        <Section title="Certifications">
          <ul className="space-y-1.5 list-none">
            {cv.certifications.map((c, i) => (
              <li key={i} className="text-sm text-[var(--text-secondary)] leading-relaxed flex gap-2">
                <span className="text-[var(--accent-blue)] shrink-0">•</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {cv.awards && cv.awards.length > 0 && (
        <Section title="Awards">
          <ul className="space-y-1.5 list-none">
            {cv.awards.map((a, i) => (
              <li key={i} className="text-sm text-[var(--text-secondary)] leading-relaxed flex gap-2">
                <span className="text-[var(--accent-blue)] shrink-0">•</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

export default function CVRewriteDisplay({
  rewriteResult,
  onScoreRewritten,
  isScoringRewritten,
  newScoreData,
}: CVRewriteDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'cv' | 'changes' | 'summary'>('cv');

  const structured = rewriteResult.structured;
  const plainText = rewriteResult.plainText ?? rewriteResult.sections?.rewrittenCV ?? '';
  const summary = rewriteResult.improvementSummary ?? rewriteResult.sections?.improvementSummary ?? '';

  const changes = useMemo<string[]>(() => {
    if (Array.isArray(rewriteResult.changesMade) && rewriteResult.changesMade.length > 0) {
      return rewriteResult.changesMade;
    }
    const legacy = rewriteResult.sections?.changesMade;
    if (typeof legacy === 'string' && legacy.trim()) {
      return legacy
        .split('\n')
        .map((line) => line.replace(/^[-•*]\s*/, '').trim())
        .filter(Boolean);
    }
    return [];
  }, [rewriteResult]);

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadCV = async () => {
    if (!structured && !plainText) return;
    setIsDownloading(true);
    setDownloadError(null);
    try {
      const { downloadCVPdf } = await import('@/lib/cv-pdf');
      downloadCVPdf({ structured, plainText });
    } catch (err) {
      console.error('Failed to generate CV PDF:', err);
      setDownloadError('Could not generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header card */}
      <div
        className="rounded-2xl p-5 sm:p-6"
        style={{
          backgroundColor: 'var(--surface-card)',
          border: '1px solid var(--border-soft)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <Edit3 className="h-5 w-5 text-[var(--accent-purple)]" />
            <h2 className="text-base sm:text-lg font-semibold truncate">AI-Rewritten CV</h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button onClick={copyToClipboard} variant="outline" size="sm" disabled={!plainText}>
              {copied ? <Check className="h-4 w-4 sm:mr-2" /> : <Copy className="h-4 w-4 sm:mr-2" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </Button>
            <Button
              onClick={downloadCV}
              variant="outline"
              size="sm"
              disabled={isDownloading || (!structured && !plainText)}
              title="Download as formatted PDF"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 sm:mr-2" />
              )}
              <span className="hidden sm:inline">{isDownloading ? 'Preparing PDF...' : 'Download PDF'}</span>
            </Button>
          </div>
        </div>

        {downloadError && (
          <div className="mb-4 banner-error">
            <p>{downloadError}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="tab-nav mb-5">
          <button
            type="button"
            onClick={() => setActiveTab('cv')}
            className={`tab-nav-item ${activeTab === 'cv' ? 'active-purple' : ''}`}
          >
            Rewritten CV
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('changes')}
            className={`tab-nav-item ${activeTab === 'changes' ? 'active' : ''}`}
          >
            Changes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`tab-nav-item ${activeTab === 'summary' ? 'active' : ''}`}
          >
            Summary
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'cv' && (
          structured ? (
            <StructuredCVRender cv={structured} />
          ) : (
            <pre
              className="rounded-xl p-6 text-sm whitespace-pre-wrap font-sans leading-relaxed"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border-soft)',
                color: 'var(--text-secondary)',
              }}
            >
              {plainText}
            </pre>
          )
        )}

        {activeTab === 'changes' && (
          <div className="card-section">
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw className="h-4 w-4 text-[var(--accent-blue)]" />
              <h3 className="text-sm font-semibold text-[var(--foreground)]">What changed</h3>
            </div>
            {changes.length > 0 ? (
              <ul className="space-y-2 list-none">
                {changes.map((c, i) => (
                  <li key={i} className="text-sm text-[var(--text-secondary)] leading-relaxed flex gap-2.5">
                    <span className="text-[var(--accent-blue)] shrink-0 font-semibold">{i + 1}.</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">No structured change list returned.</p>
            )}
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="card-section-accent">
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-4 w-4 text-[var(--accent-blue)]" />
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Improvement summary</h3>
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {summary || 'The rewrite tightened language, emphasised quantifiable achievements, and improved structure.'}
            </p>
          </div>
        )}

        {/* Score CTA */}
        <div className="mt-6 flex flex-col items-center text-center gap-2 pt-5 border-t" style={{ borderColor: 'var(--border-soft)' }}>
          <Button
            onClick={onScoreRewritten}
            disabled={isScoringRewritten || !plainText}
            className="bg-[var(--accent-purple)] hover:opacity-90 text-white"
          >
            {isScoringRewritten ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scoring rewritten CV...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                Score rewritten CV
              </>
            )}
          </Button>
          <p className="text-xs text-[var(--text-muted)]">
            Saves the new CV and updated score to your profile.
          </p>
        </div>
      </div>

      {/* Score result */}
      {newScoreData && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl p-5 sm:p-6"
          style={{
            backgroundColor: 'var(--surface-card)',
            border: '1px solid var(--border-soft)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="h-5 w-5 text-[var(--success)]" />
            <h2 className="text-base sm:text-lg font-semibold">Rewritten CV score</h2>
          </div>
          <CVScoreDisplay data={newScoreData} />
        </motion.div>
      )}
    </motion.div>
  );
}

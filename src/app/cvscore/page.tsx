'use client';

import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TrendingUp,
  Upload,
  FileText,
  CheckCircle,
  X,
  Loader2,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Target,
  Edit3,
  AlertTriangle,
  Eye,
  EyeOff,
  Trash2,
} from 'lucide-react';
import { authenticatedFetch } from '@/lib/api-helper';
import CVRewriteDisplay, { CVRewriteResult } from '@/components/CVRewriteDisplay';
import CVScoreDisplay, { CVScoreData } from '@/components/CVScoreDisplay';
import { motion, AnimatePresence } from 'framer-motion';

const ACCEPTED_TYPES = '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

interface UploadState {
  fileName: string;
  wordCount: number;
  kind: 'pdf' | 'docx';
}

function FileUploadCard({
  accent,
  upload,
  cvText,
  setCvText,
  onUpload,
  onClear,
  isProcessing,
  inputId,
}: {
  accent: 'blue' | 'purple';
  upload: UploadState | null;
  cvText: string;
  setCvText: (v: string) => void;
  onUpload: (file: File) => Promise<void>;
  onClear: () => void;
  isProcessing: boolean;
  inputId: string;
}) {
  const [showText, setShowText] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const accentVar = accent === 'blue' ? '--accent-blue' : '--accent-purple';
  const accentSoftVar = accent === 'blue' ? '--accent-blue-soft' : '--accent-purple-soft';

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await onUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const wordCount = cvText.trim() ? cvText.trim().split(/\s+/).filter(Boolean).length : 0;
  const isPasted = !upload && wordCount > 0;

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        onChange={handleFile}
        className="hidden"
        id={inputId}
        disabled={isProcessing}
      />

      {/* Subtle confirmation card OR upload zone */}
      {upload ? (
        <div
          className="rounded-xl p-4 flex items-center gap-4"
          style={{
            backgroundColor: `var(${accentSoftVar})`,
            border: `1px solid color-mix(in srgb, var(${accentVar}) 25%, transparent)`,
          }}
        >
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: `color-mix(in srgb, var(${accentVar}) 18%, transparent)`,
              color: `var(${accentVar})`,
            }}
          >
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-[var(--foreground)] truncate">{upload.fileName}</p>
              <CheckCircle className="h-4 w-4 text-[var(--success)] shrink-0" />
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {upload.kind.toUpperCase()} · {upload.wordCount.toLocaleString()} words extracted
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setShowText((s) => !s)}
              className="p-2 rounded-md text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
              aria-label={showText ? 'Hide extracted text' : 'View extracted text'}
              title={showText ? 'Hide extracted text' : 'View extracted text'}
            >
              {showText ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onClear}
              className="p-2 rounded-md text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--surface)] transition-colors"
              aria-label="Remove file"
              title="Remove file"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <label htmlFor={inputId} className="block cursor-pointer">
          <div className="upload-zone">
            {isProcessing ? (
              <div className="flex items-center justify-center text-[var(--text-muted)]">
                <Loader2 className="h-5 w-5 animate-spin mr-2.5" style={{ color: `var(${accentVar})` }} />
                <span className="text-sm">Extracting text...</span>
              </div>
            ) : (
              <div className="text-[var(--text-muted)]">
                <Upload className="h-8 w-8 mx-auto mb-2.5" style={{ color: `var(${accentVar})` }} />
                <p className="text-sm font-medium text-[var(--foreground)] mb-1">Upload PDF or Word document</p>
                <p className="text-xs text-[var(--text-subtle)]">Max 10 MB · 10–1500 words</p>
              </div>
            )}
          </div>
        </label>
      )}

      {/* Optional extracted-text preview (hidden by default) */}
      <AnimatePresence>
        {upload && showText && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs text-[var(--text-muted)]">Extracted text (editable)</p>
              <span className="text-xs text-[var(--text-subtle)]">{wordCount} words</span>
            </div>
            <textarea
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              className="form-textarea h-40"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual paste path */}
      {!upload && (
        <details className="group">
          <summary className="cursor-pointer text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] inline-flex items-center gap-1.5 select-none">
            <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
            Or paste CV text manually
          </summary>
          <div className="mt-3">
            <textarea
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              placeholder="Paste your CV text here..."
              className="form-textarea h-40"
              disabled={isProcessing}
            />
            {isPasted && (
              <div className="mt-1.5 flex items-center justify-end text-xs text-[var(--text-subtle)]">
                {wordCount} words
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}

export default function CVScorePage() {
  const [activeTab, setActiveTab] = useState<'score' | 'rewrite'>('score');
  const router = useRouter();

  // Score tab
  const [cvText, setCvText] = useState('');
  const [scoreData, setScoreData] = useState<CVScoreData | null>(null);
  const [scoreUpload, setScoreUpload] = useState<UploadState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [error, setError] = useState('');
  const [scoreResultsCollapsed, setScoreResultsCollapsed] = useState(false);

  // Rewrite tab
  const [rewriteCvText, setRewriteCvText] = useState('');
  const [rewriteUpload, setRewriteUpload] = useState<UploadState | null>(null);
  const [isProcessingRewritePdf, setIsProcessingRewritePdf] = useState(false);
  const [targetRole, setTargetRole] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteResult, setRewriteResult] = useState<CVRewriteResult | null>(null);
  const [isScoringRewritten, setIsScoringRewritten] = useState(false);
  const [newScoreData, setNewScoreData] = useState<CVScoreData | null>(null);
  const [rewriteError, setRewriteError] = useState('');

  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push('/login');
  }, [authLoading, user, router]);

  // Validate the extracted/pasted word count.
  const validateWordCount = (text: string): string | null => {
    const wc = text.trim().split(/\s+/).filter(Boolean).length;
    if (wc < 10) return 'CV is too short. Please provide at least 10 words.';
    if (wc > 1500) return 'CV exceeds 1500 words. Please shorten it before submitting.';
    return null;
  };

  const extractText = async (
    file: File,
    setBusy: (b: boolean) => void,
    setUpload: (u: UploadState | null) => void,
    setText: (t: string) => void,
    setErr: (e: string) => void
  ) => {
    setErr('');
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/extract-pdf', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to extract text');
      }
      const text = (data.text as string) || '';
      const wc = text.trim().split(/\s+/).filter(Boolean).length;
      if (wc < 10 || wc > 1500) {
        setErr(
          wc < 10
            ? 'Extracted CV is under 10 words. Please upload a different file or paste manually.'
            : 'Extracted CV exceeds 1500 words. Please shorten before scoring.'
        );
        return;
      }
      setText(text);
      setUpload({ fileName: data.fileName ?? file.name, wordCount: wc, kind: data.kind ?? 'pdf' });
    } catch (err) {
      setErr(err instanceof Error ? err.message : 'Failed to process file. Try pasting the text manually.');
    } finally {
      setBusy(false);
    }
  };

  const handleScoreUpload = (file: File) =>
    extractText(file, setIsProcessingPdf, setScoreUpload, setCvText, setError);
  const handleRewriteUpload = (file: File) =>
    extractText(file, setIsProcessingRewritePdf, setRewriteUpload, setRewriteCvText, setRewriteError);

  const handleSubmit = async () => {
    if (!cvText.trim()) {
      setError('Please upload a file or paste CV text.');
      return;
    }
    const wcError = validateWordCount(cvText);
    if (wcError) {
      setError(wcError);
      return;
    }
    if (!user) {
      router.push('/login');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await authenticatedFetch('/api/score', {
        method: 'POST',
        body: JSON.stringify({ cvText: cvText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to score CV');

      const result: CVScoreData = {
        totalScore: data.totalScore,
        breakdown: data.breakdown,
        improvementSummary: data.improvementSummary,
      };
      setScoreData(result);

      await updateDoc(doc(db, 'users', user.uid), {
        cvScore: data.totalScore,
        cvScoreTimestamp: new Date(),
        cvText: cvText.trim(),
        cvScoreBreakdown: data.breakdown,
        cvScoreAnalysis: data.score, // legacy text format for back-compat readers
        cvScoreImprovementSummary: data.improvementSummary,
      });
    } catch (err) {
      console.error('CV Score Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to score CV. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRewrite = async () => {
    if (!user) {
      setRewriteError('Please log in to use CV rewrite.');
      return;
    }
    if (!rewriteCvText.trim()) {
      setRewriteError('Please upload a file or paste CV text.');
      return;
    }
    const wcError = validateWordCount(rewriteCvText);
    if (wcError) {
      setRewriteError(wcError);
      return;
    }

    setIsRewriting(true);
    setRewriteError('');
    setNewScoreData(null);

    try {
      const res = await authenticatedFetch('/api/cv-rewrite', {
        method: 'POST',
        body: JSON.stringify({
          cvText: rewriteCvText.trim(),
          targetRole: targetRole.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to rewrite CV');
      setRewriteResult(data);
    } catch (err) {
      console.error('CV Rewrite Error:', err);
      setRewriteError(err instanceof Error ? err.message : 'Failed to rewrite CV. Please try again.');
    } finally {
      setIsRewriting(false);
    }
  };

  const handleScoreRewritten = async () => {
    if (!user || !rewriteResult) return;
    const text = rewriteResult.plainText ?? rewriteResult.sections?.rewrittenCV ?? '';
    if (!text.trim()) {
      setRewriteError('Rewritten CV is empty.');
      return;
    }

    setIsScoringRewritten(true);
    setRewriteError('');

    try {
      const res = await authenticatedFetch('/api/score', {
        method: 'POST',
        body: JSON.stringify({ cvText: text, targetRole: targetRole.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to score rewritten CV');

      const result: CVScoreData = {
        totalScore: data.totalScore,
        breakdown: data.breakdown,
        improvementSummary: data.improvementSummary,
      };
      setNewScoreData(result);

      await updateDoc(doc(db, 'users', user.uid), {
        cvScore: data.totalScore,
        cvScoreTimestamp: new Date(),
        cvText: text,
        cvScoreBreakdown: data.breakdown,
        cvScoreAnalysis: data.score,
        cvScoreImprovementSummary: data.improvementSummary,
      });
    } catch (err) {
      console.error('Score rewritten CV error:', err);
      setRewriteError(err instanceof Error ? err.message : 'Failed to score rewritten CV.');
    } finally {
      setIsScoringRewritten(false);
    }
  };

  const clearScoreTab = () => {
    setCvText('');
    setScoreData(null);
    setScoreUpload(null);
    setError('');
  };

  const clearRewriteTab = () => {
    setRewriteCvText('');
    setRewriteUpload(null);
    setTargetRole('');
    setRewriteResult(null);
    setNewScoreData(null);
    setRewriteError('');
  };

  return (
    <motion.div
      className="min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Head>
        <title>Gradual CV Tools</title>
      </Head>

      <div className="page-container">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            className="page-header"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="page-title">
              AI <span className="text-[var(--accent-blue)]">CV Tools</span>
            </h1>
            <p className="page-subtitle">
              Score your CV against four equally-weighted categories — and get an AI rewrite tailored to your target role.
            </p>
          </motion.div>

          {/* AI consistency notice */}
          <Card className="border-[var(--warning)]/30 bg-[var(--warning-soft)] section-gap">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-[var(--warning)] mt-0.5 shrink-0" />
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Scoring is generated by GPT-4o. We constrain output to a deterministic 4×25 schema, but expect minor variation between runs as the model evolves.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tab Navigation */}
          <div className="tab-nav mb-8">
            <button
              onClick={() => setActiveTab('score')}
              className={`tab-nav-item ${activeTab === 'score' ? 'active' : ''}`}
            >
              <BarChart3 className="h-4 w-4" />
              CV Scoring
            </button>
            <button
              onClick={() => setActiveTab('rewrite')}
              className={`tab-nav-item ${activeTab === 'rewrite' ? 'active-purple' : ''}`}
            >
              <Edit3 className="h-4 w-4" />
              CV Rewriting
            </button>
          </div>

          {/* CV Scoring */}
          {activeTab === 'score' && (
            <>
              <Card className="surface-card section-gap">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-center mb-4">
                    <Upload className="h-4 w-4 text-[var(--accent-blue)] mr-2" />
                    <h2 className="text-sm font-semibold">Upload your CV</h2>
                  </div>

                  <FileUploadCard
                    accent="blue"
                    upload={scoreUpload}
                    cvText={cvText}
                    setCvText={setCvText}
                    onUpload={handleScoreUpload}
                    onClear={() => {
                      setScoreUpload(null);
                      setCvText('');
                    }}
                    isProcessing={isProcessingPdf}
                    inputId="score-upload"
                  />

                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <Button
                      onClick={handleSubmit}
                      disabled={isLoading || !cvText.trim()}
                      className="flex-1 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-strong)] text-white font-semibold"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Score my CV
                        </>
                      )}
                    </Button>
                    <Button onClick={clearScoreTab} variant="outline">
                      <X className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  </div>

                  {error && (
                    <div className="mt-4 banner-error">
                      <p>{error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {scoreData && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="surface-card-elevated overflow-hidden">
                    <CardHeader
                      className="cursor-pointer hover:bg-[var(--surface-subtle)] transition-colors p-5"
                      onClick={() => setScoreResultsCollapsed((c) => !c)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-[var(--accent-blue)]" />
                          <CardTitle className="text-base font-semibold">CV Score Results</CardTitle>
                        </div>
                        {scoreResultsCollapsed ? (
                          <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
                        ) : (
                          <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" />
                        )}
                      </div>
                    </CardHeader>
                    <AnimatePresence>
                      {!scoreResultsCollapsed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <CardContent className="p-5 sm:p-6">
                            <CVScoreDisplay data={scoreData} />
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              )}
            </>
          )}

          {/* CV Rewriting */}
          {activeTab === 'rewrite' && (
            <>
              <Card className="surface-card section-gap">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-center mb-4">
                    <Upload className="h-4 w-4 text-[var(--accent-purple)] mr-2" />
                    <h2 className="text-sm font-semibold">Upload your CV</h2>
                  </div>

                  <FileUploadCard
                    accent="purple"
                    upload={rewriteUpload}
                    cvText={rewriteCvText}
                    setCvText={setRewriteCvText}
                    onUpload={handleRewriteUpload}
                    onClear={() => {
                      setRewriteUpload(null);
                      setRewriteCvText('');
                    }}
                    isProcessing={isProcessingRewritePdf}
                    inputId="rewrite-upload"
                  />

                  <div className="mt-5">
                    <div className="flex items-center mb-2">
                      <Target className="h-4 w-4 text-[var(--accent-purple)] mr-2" />
                      <h2 className="text-sm font-semibold">
                        Target role <span className="text-xs font-normal text-[var(--text-muted)]">(optional)</span>
                      </h2>
                    </div>
                    <Input
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="e.g. Software Engineer, Product Manager"
                      className="form-input"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <Button
                      onClick={handleRewrite}
                      disabled={isRewriting || !rewriteCvText.trim()}
                      className="flex-1 bg-[var(--accent-purple)] hover:opacity-90 text-white font-semibold"
                    >
                      {isRewriting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Rewriting...
                        </>
                      ) : (
                        <>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Rewrite my CV
                        </>
                      )}
                    </Button>
                    <Button onClick={clearRewriteTab} variant="outline">
                      <X className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  </div>

                  {rewriteError && (
                    <div className="mt-4 banner-error">
                      <p>{rewriteError}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {rewriteResult && (
                <CVRewriteDisplay
                  rewriteResult={rewriteResult}
                  onScoreRewritten={handleScoreRewritten}
                  isScoringRewritten={isScoringRewritten}
                  newScoreData={newScoreData}
                />
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

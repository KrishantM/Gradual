'use client';

import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  Upload, 
  FileText, 
  Brain, 
  CheckCircle, 
  X, 
  Loader2,
  Star,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Target,
  Edit3,
  Info,
  AlertTriangle
} from 'lucide-react';
import { authenticatedFetch } from '@/lib/api-helper';
import CVRewriteDisplay from '@/components/CVRewriteDisplay';
import { motion, AnimatePresence } from 'framer-motion';

// Enhanced Score Display Component
const EnhancedScoreDisplay = ({ score }: { score: string }) => {
  const parseScore = (scoreText: string) => {
    const overallMatch = scoreText.match(/Overall Score \(0–100\): (\d+)/);
    const overallScore = overallMatch ? parseInt(overallMatch[1]) : 0;
    
    const sections = [];
    const lines = scoreText.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this line starts a new category (e.g., "1. Professionalism:")
      if (line.match(/^\d+\./)) {
        const category = line.split(':')[0].replace(/^\d+\.\s*/, '');
        
        // Look for the score in the next few lines
        let score = 0;
        let feedback = '';
        
        for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
          const nextLine = lines[j].trim();
          
          // Check if this line contains a score
          const scoreMatch = nextLine.match(/Score: (\d+)\/25/);
          if (scoreMatch) {
            score = parseInt(scoreMatch[1]);
            // Extract feedback (everything before "Score:")
            feedback = nextLine.split('Score:')[0].trim();
            break;
          }
        }
        
        if (score > 0) {
          sections.push({ 
            category, 
            score, 
            maxScore: 25, 
            feedback: feedback || `${category} analysis` 
          });
        }
      }
    }
    
    return { overallScore, sections };
  };

  const { overallScore, sections } = parseScore(score);
  
  console.log('Parsed CV Score:', { overallScore, sections });
  
  const getScoreClass = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'score-excellent';
    if (percentage >= 60) return 'score-good';
    if (percentage >= 40) return 'score-fair';
    return 'score-poor';
  };

  const getScoreBgClass = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'score-bg-excellent';
    if (percentage >= 60) return 'score-bg-good';
    if (percentage >= 40) return 'score-bg-fair';
    return 'score-bg-poor';
  };

  const getOverallScoreClass = (score: number) => {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-fair';
    return 'score-poor';
  };

  const getCategoryFeedback = (scoreText: string, category: string) => {
    // Find the section that matches this category
    const section = sections.find(s => s.category.toLowerCase().includes(category.toLowerCase()));
    
    if (section && section.feedback) {
      return section.feedback;
    }
    
    // If no specific feedback found, provide generic feedback based on score
    if (section) {
      const percentage = (section.score / section.maxScore) * 100;
      if (percentage >= 80) {
        return `Excellent ${category.toLowerCase()}. This area is well-developed and professional.`;
      } else if (percentage >= 60) {
        return `Good ${category.toLowerCase()}. Consider adding more specific examples and details.`;
      } else if (percentage >= 40) {
        return `${category} needs improvement. Focus on adding more relevant content and professional language.`;
      } else {
        return `${category} requires significant attention. This is a key area for improvement.`;
      }
    }
    
    return `Focus on improving ${category.toLowerCase()} with more specific examples and professional language.`;
  };

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-center"
      >
        <div className="score-ring" style={{ border: `3px solid var(--accent-blue)` }}>
          <div className="score-ring-inner">
            <div className={`text-4xl font-bold mb-1 ${getOverallScoreClass(overallScore)}`}>
              {overallScore}
            </div>
            <div className="text-sm text-[var(--text-muted)]">Overall Score</div>
          </div>
        </div>
      </motion.div>

      {/* Detailed Feedback Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="space-y-4"
      >
        {/* Areas to Improve */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="card-section-accent"
        >
          <div className="flex items-center mb-3">
            <Target className="h-5 w-5 text-[var(--accent-blue)] mr-2" />
            <h3 className="text-base font-semibold">Areas to Improve</h3>
          </div>
          <div className="text-[var(--text-secondary)] text-sm leading-relaxed">
            {score.split('5. Areas to improve:')[1]?.trim() || 'Focus on enhancing professional language, adding quantifiable achievements, and improving overall structure.'}
          </div>
        </motion.div>

        {/* Detailed Category Feedback */}
        {sections.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="card-section"
          >
            <div className="flex items-center mb-4">
              <Brain className="h-5 w-5 text-[var(--accent-purple)] mr-2" />
              <h3 className="text-base font-semibold">Scoring Breakdown</h3>
            </div>

            <div className="space-y-3">
              {sections.map((section, index) => {
                const feedback = getCategoryFeedback(score, section.category);
                return (
                  <motion.div
                    key={`feedback-${section.category}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 1.4 + index * 0.1 }}
                    className="feedback-card"
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${getScoreBgClass(section.score, section.maxScore)}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-sm">{section.category}</h4>
                          <span className={`text-xl font-bold ${getScoreClass(section.score, section.maxScore)}`}>{section.score}/{section.maxScore}</span>
                        </div>
                        <p className="text-[var(--text-muted)] text-sm leading-relaxed">{feedback}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default function CVScorePage() {
  const [activeTab, setActiveTab] = useState<'score' | 'rewrite'>('score');
  const router = useRouter();

  // CV Score Tab State
  const [cvText, setCvText] = useState('');
  const [score, setScore] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [error, setError] = useState('');
  const [scoreResultsCollapsed, setScoreResultsCollapsed] = useState(false);
  
  // CV Rewrite Tab State
  const [rewriteCvText, setRewriteCvText] = useState('');
  const [rewriteFile, setRewriteFile] = useState<File | null>(null);
  const [isProcessingRewritePdf, setIsProcessingRewritePdf] = useState(false);
  const [targetRole, setTargetRole] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteResult, setRewriteResult] = useState<any>(null);
  const [isScoringRewritten, setIsScoringRewritten] = useState(false);
  const [newScore, setNewScore] = useState('');
  const [rewriteError, setRewriteError] = useState('');

  const { user, loading: authLoading } = useAuth();

  // Redirect unauthenticated users — wait for auth to settle so we don't bounce
  // signed-in users on a refresh.
  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push('/login');
  }, [authLoading, user, router]);

  // Simple cache for CV scores to ensure consistency
  const [cvScoreCache, setCvScoreCache] = useState<Map<string, string>>(new Map());

  // CV Score Tab Functions
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile || uploadedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }
    if (uploadedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB.');
      return;
    }

    setError('');
    setIsProcessingPdf(true);
    setFile(uploadedFile);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const res = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Failed to extract text from PDF');
      }

      const data = await res.json();
      setCvText(data.text || '');
      
      // Validate word count after PDF extraction
      const extractedWordCount = (data.text || '').trim().split(/\s+/).length;
      if (extractedWordCount > 1500) {
        setError('Extracted CV is too long (over 1500 words). Please upload a shorter CV or edit the text manually.');
        setCvText('');
        setFile(null);
        return;
      }
      
      if (extractedWordCount < 10) {
        setError('Extracted CV is too short (less than 10 words). Please check if the PDF contains readable text.');
        setCvText('');
        setFile(null);
        return;
      }
    } catch (err) {
      setError('Failed to process PDF. Please try again or paste text manually.');
    } finally {
      setIsProcessingPdf(false);
    }
  };

  const handleSubmit = async () => {
    if (!cvText.trim()) {
      setError('Please provide CV text or upload a PDF.');
      return;
    }

    // FRONTEND WORD COUNT VALIDATION
    const wordCount = cvText.trim().split(/\s+/).length;
    
    if (wordCount < 10) {
      setError('CV is too short. Please provide at least 10 words for evaluation.');
      return;
    }
    
    if (wordCount > 1500) {
      setError('CV is too long. Maximum allowed is 1500 words. Please shorten your CV to focus on the most relevant information.');
      return;
    }

    // Check cache first for identical CV text
    const normalizedCvText = cvText.trim().toLowerCase();
    const cachedScore = cvScoreCache.get(normalizedCvText);
    
    if (cachedScore) {
      console.log('Using cached score for identical CV text');
      setScore(cachedScore);
      return;
    }

    setIsLoading(true);
    setError('');

    if (!user) {
      router.push('/login');
      return;
    }

    try {
      // Get previous CV score for comparison
      const previousScore = await getPreviousCVScore();
      const shouldPassPreviousScore = previousScore && await isSimilarCV(cvText.trim(), previousScore);

      const res = await authenticatedFetch('/api/score', {
        method: 'POST',
        body: JSON.stringify({
          cvText: cvText.trim(),
          guest: false,
          originalScore: shouldPassPreviousScore ? previousScore : undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to get score');
      }

      const data = await res.json();
      console.log('CV Score API Response:', data);
      console.log('Score value:', data.score);
      setScore(data.score);

      // Cache the score for this CV text to ensure consistency
      setCvScoreCache(prev => new Map(prev).set(normalizedCvText, data.score));

      // Save to Firestore
      if (user) {
        const numericalScore = extractNumericalScore(data.score);
        const analysisText = data.score ? String(data.score) : null;

        const updateData: Record<string, any> = {
          cvScore: numericalScore,
          cvScoreTimestamp: new Date(),
          cvText: cvText.trim(),
        };

        if (data.breakdown) {
          updateData.cvScoreBreakdown = data.breakdown;
        }

        if (analysisText) {
          updateData.cvScoreAnalysis = analysisText;
        }

        await updateDoc(doc(db, 'users', user.uid), updateData);
      }
    } catch (err) {
      console.error('CV Score Error:', err);
      setError('Failed to get CV score. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // CV Rewrite Tab Functions
  const handleRewriteFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile || uploadedFile.type !== 'application/pdf') {
      setRewriteError('Please upload a PDF file.');
      return;
    }
    if (uploadedFile.size > 10 * 1024 * 1024) {
      setRewriteError('File size must be less than 10MB.');
      return;
    }

    setRewriteError('');
    setIsProcessingRewritePdf(true);
    setRewriteFile(uploadedFile);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const res = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Failed to extract text from PDF');
      }

      const data = await res.json();
      setRewriteCvText(data.text || '');
      
      // Validate word count after PDF extraction
      const extractedWordCount = (data.text || '').trim().split(/\s+/).length;
      if (extractedWordCount > 1500) {
        setRewriteError('Extracted CV is too long (over 1500 words). Please upload a shorter CV or edit the text manually.');
        setRewriteCvText('');
        setRewriteFile(null);
        return;
      }
      
      if (extractedWordCount < 10) {
        setRewriteError('Extracted CV is too short (less than 10 words). Please check if the PDF contains readable text.');
        setRewriteCvText('');
        setRewriteFile(null);
        return;
      }
    } catch (err) {
      setRewriteError('Failed to process PDF. Please try again or paste text manually.');
    } finally {
      setIsProcessingRewritePdf(false);
    }
  };

  const handleRewrite = async () => {
    if (!user) {
      setRewriteError('Please log in to use the CV rewrite feature.');
      return;
    }

    if (!rewriteCvText.trim()) {
      setRewriteError('Please provide CV text or upload a PDF.');
      return;
    }

    // FRONTEND WORD COUNT VALIDATION FOR REWRITE
    const wordCount = rewriteCvText.trim().split(/\s+/).length;
    
    if (wordCount < 10) {
      setRewriteError('CV is too short. Please provide at least 10 words for evaluation.');
      return;
    }
    
    if (wordCount > 1500) {
      setRewriteError('CV is too long. Maximum allowed is 1500 words. Please shorten your CV to focus on the most relevant information.');
      return;
    }

    setIsRewriting(true);
    setRewriteError('');

    try {
      const res = await authenticatedFetch('/api/cv-rewrite', {
        method: 'POST',
        body: JSON.stringify({ 
          cvText: rewriteCvText.trim(), 
          targetRole: targetRole.trim() || undefined
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to rewrite CV');
      }

      const data = await res.json();
      setRewriteResult(data);
    } catch (err) {
      console.error('CV Rewrite Error:', err);
      setRewriteError('Failed to rewrite CV. Please try again.');
    } finally {
      setIsRewriting(false);
    }
  };

  const handleScoreRewritten = async () => {
    if (!user || !rewriteResult) {
      setRewriteError('Please log in and generate a rewrite first.');
      return;
    }

    setIsScoringRewritten(true);
    setRewriteError('');

    try {
      // Use the unified scoring endpoint for rewritten CVs
      const res = await authenticatedFetch('/api/score', {
        method: 'POST',
        body: JSON.stringify({ 
          cvText: rewriteResult.sections.rewrittenCV,
          guest: false,
          isRewrittenCV: true,
          rewriteId: rewriteResult.sections.rewriteId
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to score rewritten CV');
      }

      const data = await res.json();
      setNewScore(data.score);
      
      // Extract numerical score and save to Firestore
      const numericalScore = extractNumericalScore(data.score);
      
      const rewriteAnalysis = data.score ? String(data.score) : null;
      const updateData: any = {
        cvScore: numericalScore,
        cvScoreTimestamp: new Date(),
        cvText: rewriteResult.sections.rewrittenCV,
      };

      if (data.breakdown) {
        updateData.cvScoreBreakdown = data.breakdown;
      }

      if (rewriteAnalysis) {
        updateData.cvScoreAnalysis = rewriteAnalysis;
      }

      await updateDoc(doc(db, 'users', user.uid), updateData);

      console.log('Scoring Debug Info:', {
        rewrittenCVLength: rewriteResult.sections.rewrittenCV.length,
        newScore: data.score,
        numericalScore,
        cvHash: data.cvHash
      });
    } catch (err) {
      console.error('Score Rewritten CV Error:', err);
      setRewriteError('Failed to score rewritten CV. Please try again.');
    } finally {
      setIsScoringRewritten(false);
    }
  };

  // Helper functions
  const getPreviousCVScore = async (): Promise<number | null> => {
    if (!user) return null;
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        return userData.cvScore || null;
      }
    } catch (err) {
      console.warn('Could not fetch previous CV score:', err);
    }
    return null;
  };

  const isSimilarCV = async (currentCVText: string, previousScore: number): Promise<boolean> => {
    if (!user) return false;
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const previousCVText = userData.cvText || '';
        if (!previousCVText) return false;
        
        const currentLength = currentCVText.length;
        const previousLength = previousCVText.length;
        const lengthDiff = Math.abs(currentLength - previousLength) / Math.max(currentLength, previousLength);
        
        if (lengthDiff > 0.3) return false;
        
        const currentWords = new Set(currentCVText.toLowerCase().split(/\s+/));
        const previousWords = new Set(previousCVText.toLowerCase().split(/\s+/));
        const commonWords = [...currentWords].filter(word => previousWords.has(word));
        const overlapRatio = commonWords.length / Math.max(currentWords.size, previousWords.size);
        
        return overlapRatio > 0.4;
      }
    } catch (err) {
      console.warn('Could not check CV similarity:', err);
    }
    return false;
  };

  const extractNumericalScore = (scoreText: string): number => {
    if (!scoreText || typeof scoreText !== 'string') return 0;
    
    // Look for "Overall Score (0–100): X" pattern
    const match = scoreText.match(/Overall Score \(0–100\): (\d+)/);
    if (match) {
      return parseInt(match[1]);
    }
    
    // Fallback: try to extract any number from the text
    const numberMatch = scoreText.match(/(\d+)/);
    return numberMatch ? parseInt(numberMatch[1]) : 0;
  };

  const clearScoreTab = () => {
    setCvText('');
    setScore('');
    setFile(null);
    setError('');
    setCvScoreCache(new Map());
  };

  const clearRewriteTab = () => {
    setRewriteCvText('');
    setRewriteFile(null);
    setRewriteError('');
    setTargetRole('');
    setRewriteResult(null);
    setNewScore('');
  };

  return (
    <motion.div 
      className="min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
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
              Score your CV and get AI-powered rewrites to improve your career prospects
            </p>
          </motion.div>

          {/* AI Consistency Disclaimer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card className="border-[var(--warning)]/30 bg-[var(--warning-soft)] section-gap">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-[var(--warning)] mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm mb-1">AI Scoring Consistency Notice</h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Our CV scoring combines deterministic analysis (60-70%) with AI enhancement (30-40%). 
                    While we strive for consistency, AI-powered scoring may vary slightly between sessions due to the evolving nature of AI technology. 
                    Scores are designed to be reliable indicators of CV quality and improvement areas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>

          {/* Tab Navigation */}
          <div className="tab-nav mb-8">
            <button
              onClick={() => setActiveTab('score')}
              className={`tab-nav-item ${activeTab === 'score' ? 'active' : ''}`}
            >
              <BarChart3 className="h-5 w-5" />
              CV Scoring
            </button>
            <button
              onClick={() => setActiveTab('rewrite')}
              className={`tab-nav-item ${activeTab === 'rewrite' ? 'active-purple' : ''}`}
            >
              <Edit3 className="h-5 w-5" />
              CV Rewriting
            </button>
          </div>

          {/* CV Scoring Tab */}
          {activeTab === 'score' && (
            <>
              {/* Main Form Card */}
              <Card className="surface-card mb-8">
                <CardContent className="p-5 sm:p-6">
                  {/* File Upload Section */}
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <Upload className="h-5 w-5 text-[var(--accent-blue)] mr-2.5" />
                      <h2 className="text-base font-semibold">Upload PDF CV</h2>
                    </div>

                    <div className="relative">
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="pdf-upload"
                        disabled={isProcessingPdf}
                      />
                      <label htmlFor="pdf-upload" className="cursor-pointer">
                        <div className="upload-zone">
                          {isProcessingPdf ? (
                            <div className="flex items-center justify-center">
                              <Loader2 className="h-8 w-8 text-[var(--accent-blue)] animate-spin mr-3" />
                              <span className="text-[var(--text-muted)]">Processing PDF...</span>
                            </div>
                          ) : (
                            <div className="text-[var(--text-muted)]">
                              <Upload className="h-10 w-10 text-[var(--accent-blue)] mx-auto mb-3" />
                              <p className="text-sm font-medium mb-1">Click to upload PDF or drag and drop</p>
                              <p className="text-xs text-[var(--text-subtle)]">Maximum file size: 10MB &middot; 10-1500 words</p>
                            </div>
                          )}
                        </div>
                      </label>
                    </div>

                    {file && (
                      <div className="mt-3 flex items-center text-[var(--success)] text-sm">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {file.name} uploaded successfully
                      </div>
                    )}
                  </div>

                  {/* Text Input Section */}
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <FileText className="h-5 w-5 text-[var(--accent-blue)] mr-2.5" />
                      <h2 className="text-base font-semibold">Or Paste CV Text</h2>
                    </div>

                    <p className="text-[var(--text-muted)] text-sm mb-3">
                      Your CV should be between 10-1500 words for optimal analysis
                    </p>
                    <textarea
                      value={cvText}
                      onChange={(e) => setCvText(e.target.value)}
                      placeholder="Paste your CV text here..."
                      className="form-textarea h-48"
                      disabled={isProcessingPdf}
                    />

                    {/* Word Counter Display */}
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-4">
                        <span className={cvText.trim().split(/\s+/).length < 10 ? 'text-[var(--danger)]' : 'text-[var(--text-subtle)]'}>
                          Min: 10 words
                        </span>
                        <span className={cvText.trim().split(/\s+/).length > 1500 ? 'text-[var(--danger)]' : 'text-[var(--text-subtle)]'}>
                          Max: 1500 words
                        </span>
                      </div>
                      <span className={`font-medium ${
                        cvText.trim().split(/\s+/).length < 10 || cvText.trim().split(/\s+/).length > 1500
                          ? 'text-[var(--danger)]'
                          : cvText.trim().split(/\s+/).length < 300
                            ? 'text-[var(--warning)]'
                            : 'text-[var(--success)]'
                      }`}>
                        {cvText.trim().split(/\s+/).length} words
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={handleSubmit}
                      disabled={isLoading || !cvText.trim()}
                      className="flex-1 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-strong)] text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Analyzing CV...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <TrendingUp className="h-5 w-5 mr-2" />
                          Score My CV
                        </div>
                      )}
                    </Button>

                    <Button
                      onClick={clearScoreTab}
                      variant="outline"
                    >
                      <X className="h-5 w-5 mr-2" />
                      Clear All
                    </Button>
                  </div>

                  {/* Error Display */}
                  {error && (
                    <div className="mt-5 banner-error">
                      <p>{error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* CV Score Results */}
              {score && (
                <motion.div
                  initial={{ opacity: 0, y: 50, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  <Card className="surface-card-elevated mb-6 overflow-hidden">
                    <CardHeader
                      className="cursor-pointer hover:bg-[var(--surface-subtle)] transition-all duration-200 p-5 relative"
                      onClick={() => setScoreResultsCollapsed(!scoreResultsCollapsed)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <BarChart3 className="h-5 w-5 text-[var(--accent-blue)]" />
                          <CardTitle className="text-lg font-bold">CV Score Results</CardTitle>
                        </div>
                        {scoreResultsCollapsed ? <ChevronDown className="h-5 w-5 text-[var(--text-subtle)]" /> : <ChevronUp className="h-5 w-5 text-[var(--text-subtle)]" />}
                      </div>
                    </CardHeader>
                    <AnimatePresence>
                      {!scoreResultsCollapsed && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.5, ease: "easeInOut" }}
                        >
                          <CardContent className="p-6">
                            <EnhancedScoreDisplay score={score} />
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              )}
            </>
          )}

          {/* CV Rewriting Tab */}
          {activeTab === 'rewrite' && (
            <>
              {/* Main Form Card */}
              <Card className="surface-card mb-8">
                <CardContent className="p-5 sm:p-6">
                  {/* File Upload Section */}
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <Upload className="h-5 w-5 text-[var(--accent-purple)] mr-2.5" />
                      <h2 className="text-base font-semibold">Upload PDF CV</h2>
                    </div>

                    <div className="relative">
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleRewriteFileUpload}
                        className="hidden"
                        id="rewrite-pdf-upload"
                        disabled={isProcessingRewritePdf}
                      />
                      <label htmlFor="rewrite-pdf-upload" className="cursor-pointer">
                        <div className="upload-zone">
                          {isProcessingRewritePdf ? (
                            <div className="flex items-center justify-center">
                              <Loader2 className="h-8 w-8 text-[var(--accent-purple)] animate-spin mr-3" />
                              <span className="text-[var(--text-muted)]">Processing PDF...</span>
                            </div>
                          ) : (
                            <div className="text-[var(--text-muted)]">
                              <Upload className="h-10 w-10 text-[var(--accent-purple)] mx-auto mb-3" />
                              <p className="text-sm font-medium mb-1">Click to upload PDF or drag and drop</p>
                              <p className="text-xs text-[var(--text-subtle)]">Maximum file size: 10MB &middot; 10-1500 words</p>
                            </div>
                          )}
                        </div>
                      </label>
                    </div>

                    {rewriteFile && (
                      <div className="mt-3 flex items-center text-[var(--success)] text-sm">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {rewriteFile.name} uploaded successfully
                      </div>
                    )}
                  </div>

                  {/* Text Input Section */}
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <FileText className="h-5 w-5 text-[var(--accent-purple)] mr-2.5" />
                      <h2 className="text-base font-semibold">Or Paste CV Text</h2>
                    </div>

                    <p className="text-[var(--text-muted)] text-sm mb-3">
                      Your CV should be between 10-1500 words for optimal rewriting
                    </p>
                    <textarea
                      value={rewriteCvText}
                      onChange={(e) => setRewriteCvText(e.target.value)}
                      placeholder="Paste your CV text here..."
                      className="form-textarea h-48"
                      disabled={isProcessingRewritePdf}
                    />

                    {/* Word Counter Display */}
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-4">
                        <span className={rewriteCvText.trim().split(/\s+/).length < 10 ? 'text-[var(--danger)]' : 'text-[var(--text-subtle)]'}>
                          Min: 10 words
                        </span>
                        <span className={rewriteCvText.trim().split(/\s+/).length > 1500 ? 'text-[var(--danger)]' : 'text-[var(--text-subtle)]'}>
                          Max: 1500 words
                        </span>
                      </div>
                      <span className={`font-medium ${
                        rewriteCvText.trim().split(/\s+/).length < 10 || rewriteCvText.trim().split(/\s+/).length > 1500
                          ? 'text-[var(--danger)]'
                          : rewriteCvText.trim().split(/\s+/).length < 300
                            ? 'text-[var(--warning)]'
                            : 'text-[var(--success)]'
                      }`}>
                        {rewriteCvText.trim().split(/\s+/).length} words
                      </span>
                    </div>
                  </div>

                  {/* Target Role Input */}
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <Target className="h-5 w-5 text-[var(--accent-purple)] mr-2.5" />
                      <h2 className="text-base font-semibold">Target Role (Optional)</h2>
                    </div>
                    <Input
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="e.g., Software Engineer, Marketing Manager..."
                      className="form-input"
                    />
                    <p className="text-[var(--text-muted)] text-sm mt-2">
                      Specify a target role to get more tailored rewrite suggestions
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={handleRewrite}
                      disabled={isRewriting || !rewriteCvText.trim()}
                      className="flex-1 bg-[var(--accent-purple)] hover:opacity-90 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRewriting ? (
                        <div className="flex items-center">
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Rewriting CV...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Edit3 className="h-5 w-5 mr-2" />
                          Rewrite My CV
                        </div>
                      )}
                    </Button>

                    <Button
                      onClick={clearRewriteTab}
                      variant="outline"
                    >
                      <X className="h-5 w-5 mr-2" />
                      Clear All
                    </Button>
                  </div>

                  {/* Error Display */}
                  {rewriteError && (
                    <div className="mt-5 banner-error">
                      <p>{rewriteError}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* CV Rewrite Display */}
              {rewriteResult && (
                <CVRewriteDisplay
                  rewriteResult={rewriteResult}
                  onScoreRewritten={handleScoreRewritten}
                  isScoringRewritten={isScoringRewritten}
                  newScore={newScore}
                  originalScore=""
                />
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
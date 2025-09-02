'use client';

import Head from 'next/head';
import { useState } from 'react';
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

export default function CVScorePage() {
  const [activeTab, setActiveTab] = useState<'score' | 'rewrite'>('score');
  
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

  const { user } = useAuth();

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

    try {
      let res;
      
      if (user) {
        // Get previous CV score for comparison
        const previousScore = await getPreviousCVScore();
        const shouldPassPreviousScore = previousScore && await isSimilarCV(cvText.trim(), previousScore);
        
        console.log('CV Scoring - Similarity Check:', {
          hasPreviousScore: !!previousScore,
          previousScore,
          shouldPassPreviousScore,
          cvTextLength: cvText.trim().length
        });
        
        // Use authenticated API call with unified scoring endpoint
        res = await authenticatedFetch('/api/score', {
          method: 'POST',
          body: JSON.stringify({ 
            cvText: cvText.trim(), 
            guest: false,
            originalScore: shouldPassPreviousScore ? previousScore : undefined
          }),
        });
      } else {
        // Use guest mode
        res = await fetch('/api/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cvText: cvText.trim(), guest: true }),
        });
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to get score');
      }

      const data = await res.json();
      setScore(data.score);

      // Cache the score for this CV text to ensure consistency
      setCvScoreCache(prev => new Map(prev).set(normalizedCvText, data.score));

      // Only save to Firestore if user is logged in
      if (user) {
        // Extract numerical score for storage
        const numericalScore = extractNumericalScore(data.score);
        
        const updateData: any = {
          cvScore: numericalScore,
          cvScoreTimestamp: new Date(),
        };
        
        // Save breakdown if available
        if (data.breakdown) {
          updateData.cvScoreBreakdown = data.breakdown;
        }
        
        // Save the full CV analysis text for display on dashboard
        if (data.score && typeof data.score === 'string') {
          updateData.cvScoreAnalysis = data.score;
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
      
      const updateData: any = {
        cvScore: numericalScore,
        cvScoreTimestamp: new Date(),
      };
      
      // Save breakdown if available
      if (data.breakdown) {
        updateData.cvScoreBreakdown = data.breakdown;
      }
      
      // Save the full CV analysis text for display on dashboard
      if (data.score && typeof data.score === 'string') {
        updateData.cvScoreAnalysis = data.score;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black">
      <Head>
        <title>Gradual CV Tools</title>
      </Head>
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="mb-6">
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                AI <span className="text-blue-400">CV Tools</span>
              </h1>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Score your CV and get AI-powered rewrites to improve your career prospects
              </p>
            </div>
          </div>

          {/* AI Consistency Disclaimer */}
          <Card className="bg-amber-500/10 backdrop-blur-md border-amber-400/30 shadow-2xl mb-8">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-amber-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-amber-300 font-semibold mb-2">AI Scoring Consistency Notice</h3>
                  <p className="text-amber-200 text-sm leading-relaxed">
                    Our CV scoring combines deterministic analysis (60-70%) with AI enhancement (30-40%). 
                    While we strive for consistency, AI-powered scoring may vary slightly between sessions due to the evolving nature of AI technology. 
                    Scores are designed to be reliable indicators of CV quality and improvement areas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tab Navigation */}
          <div className="flex mb-8 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('score')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-md transition-all duration-300 ${
                activeTab === 'score'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              CV Scoring
            </button>
            <button
              onClick={() => setActiveTab('rewrite')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-md transition-all duration-300 ${
                activeTab === 'rewrite'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Edit3 className="h-5 w-5" />
              CV Rewriting
            </button>
          </div>

          {/* CV Scoring Tab */}
          {activeTab === 'score' && (
            <>
              {/* Main Form Card */}
              <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl mb-8">
                <CardContent className="p-8">
                  {/* File Upload Section */}
                  <div className="mb-8">
                    <div className="flex items-center mb-4">
                      <Upload className="h-6 w-6 text-blue-400 mr-3" />
                      <h2 className="text-xl font-semibold text-white">Upload PDF CV</h2>
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
                        <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-blue-400/50 transition-colors duration-300 bg-white/5">
                          {isProcessingPdf ? (
                            <div className="flex items-center justify-center">
                              <Loader2 className="h-8 w-8 text-blue-400 animate-spin mr-3" />
                              <span className="text-gray-300">Processing PDF...</span>
                            </div>
                          ) : (
                            <div className="text-gray-300">
                              <Upload className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                              <p className="text-lg font-medium mb-2">Click to upload PDF or drag and drop</p>
                              <p className="text-sm text-gray-400">Maximum file size: 10MB</p>
                              <p className="text-xs text-gray-500 mt-1">CV must be 10-1500 words</p>
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                    
                    {file && (
                      <div className="mt-4 flex items-center text-green-400 text-sm">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {file.name} uploaded successfully
                      </div>
                    )}
                  </div>

                  {/* Text Input Section */}
                  <div className="mb-8">
                    <div className="flex items-center mb-4">
                      <FileText className="h-6 w-6 text-blue-400 mr-3" />
                      <h2 className="text-xl font-semibold text-white">Or Paste CV Text</h2>
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-3">
                      Your CV should be between 10-1500 words for optimal analysis
                    </p>
                    <textarea
                      value={cvText}
                      onChange={(e) => setCvText(e.target.value)}
                      placeholder="Paste your CV text here..."
                      className="w-full h-48 p-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-gray-400 resize-none focus:outline-none focus:border-blue-400/50 transition-colors duration-300"
                      disabled={isProcessingPdf}
                    />
                    
                    {/* Word Counter Display */}
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <span className={`${cvText.trim().split(/\s+/).length < 10 ? 'text-red-400' : 'text-gray-400'}`}>
                          Min: 10 words
                        </span>
                        <span className={`${cvText.trim().split(/\s+/).length > 1500 ? 'text-red-400' : 'text-gray-400'}`}>
                          Max: 1500 words
                        </span>
                      </div>
                      <span className={`font-medium ${
                        cvText.trim().split(/\s+/).length < 10 || cvText.trim().split(/\s+/).length > 1500 
                          ? 'text-red-400' 
                          : cvText.trim().split(/\s+/).length < 300 
                            ? 'text-yellow-400' 
                            : 'text-green-400'
                      }`}>
                        {cvText.trim().split(/\s+/).length} words
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={handleSubmit}
                      disabled={isLoading || !cvText.trim()}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <X className="h-5 w-5 mr-2" />
                      Clear All
                    </Button>
                  </div>

                  {/* Error Display */}
                  {error && (
                    <div className="mt-6 p-4 bg-red-500/20 border border-red-400/30 rounded-lg">
                      <p className="text-red-300 text-center">{error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* CV Score Results */}
              {score && (
                <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl mb-6">
                  <CardHeader 
                    className="cursor-pointer hover:bg-white/10 transition-colors p-6"
                    onClick={() => setScoreResultsCollapsed(!scoreResultsCollapsed)}
                  >
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl text-white">CV Score Results</CardTitle>
                      {scoreResultsCollapsed ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronUp className="h-5 w-5 text-gray-400" />}
                    </div>
                  </CardHeader>
                  {!scoreResultsCollapsed && (
                    <CardContent className="p-6">
                      <div className="whitespace-pre-wrap text-gray-200 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                        {score}
                      </div>
                    </CardContent>
                  )}
                </Card>
              )}
            </>
          )}

          {/* CV Rewriting Tab */}
          {activeTab === 'rewrite' && (
            <>
              {/* Main Form Card */}
              <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl mb-8">
                <CardContent className="p-8">
                  {/* File Upload Section */}
                  <div className="mb-8">
                    <div className="flex items-center mb-4">
                      <Upload className="h-6 w-6 text-purple-400 mr-3" />
                      <h2 className="text-xl font-semibold text-white">Upload PDF CV</h2>
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
                        <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-purple-400/50 transition-colors duration-300 bg-white/5">
                          {isProcessingRewritePdf ? (
                            <div className="flex items-center justify-center">
                              <Loader2 className="h-8 w-8 text-purple-400 animate-spin mr-3" />
                              <span className="text-gray-300">Processing PDF...</span>
                            </div>
                          ) : (
                            <div className="text-gray-300">
                              <Upload className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                              <p className="text-lg font-medium mb-2">Click to upload PDF or drag and drop</p>
                              <p className="text-sm text-gray-400">Maximum file size: 10MB</p>
                              <p className="text-xs text-gray-500 mt-1">CV must be 10-1500 words</p>
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                    
                    {rewriteFile && (
                      <div className="mt-4 flex items-center text-green-400 text-sm">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {rewriteFile.name} uploaded successfully
                      </div>
                    )}
                  </div>

                  {/* Text Input Section */}
                  <div className="mb-8">
                    <div className="flex items-center mb-4">
                      <FileText className="h-6 w-6 text-purple-400 mr-3" />
                      <h2 className="text-xl font-semibold text-white">Or Paste CV Text</h2>
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-3">
                      Your CV should be between 10-1500 words for optimal rewriting
                    </p>
                    <textarea
                      value={rewriteCvText}
                      onChange={(e) => setRewriteCvText(e.target.value)}
                      placeholder="Paste your CV text here..."
                      className="w-full h-48 p-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-gray-400 resize-none focus:outline-none focus:border-purple-400/50 transition-colors duration-300"
                      disabled={isProcessingRewritePdf}
                    />
                    
                    {/* Word Counter Display */}
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <span className={`${rewriteCvText.trim().split(/\s+/).length < 10 ? 'text-red-400' : 'text-gray-400'}`}>
                          Min: 10 words
                        </span>
                        <span className={`${rewriteCvText.trim().split(/\s+/).length > 1500 ? 'text-red-400' : 'text-gray-400'}`}>
                          Max: 1500 words
                        </span>
                      </div>
                      <span className={`font-medium ${
                        rewriteCvText.trim().split(/\s+/).length < 10 || rewriteCvText.trim().split(/\s+/).length > 1500 
                          ? 'text-red-400' 
                          : rewriteCvText.trim().split(/\s+/).length < 300 
                            ? 'text-yellow-400' 
                            : 'text-green-400'
                      }`}>
                        {rewriteCvText.trim().split(/\s+/).length} words
                      </span>
                    </div>
                  </div>

                  {/* Target Role Input */}
                  <div className="mb-8">
                    <div className="flex items-center mb-4">
                      <Target className="h-6 w-6 text-purple-400 mr-3" />
                      <h2 className="text-xl font-semibold text-white">Target Role (Optional)</h2>
                    </div>
                    <Input
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="e.g., Software Engineer, Marketing Manager..."
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                    <p className="text-gray-400 text-sm mt-2">
                      Specify a target role to get more tailored rewrite suggestions
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={handleRewrite}
                      disabled={isRewriting || !rewriteCvText.trim()}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <X className="h-5 w-5 mr-2" />
                      Clear All
                    </Button>
                  </div>

                  {/* Error Display */}
                  {rewriteError && (
                    <div className="mt-6 p-4 bg-red-500/20 border border-red-400/30 rounded-lg">
                      <p className="text-red-300 text-center">{rewriteError}</p>
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
    </div>
  );
}
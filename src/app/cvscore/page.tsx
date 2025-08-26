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
  Edit3
} from 'lucide-react';
import { authenticatedFetch } from '@/lib/api-helper';
import CVRewriteDisplay from '@/components/CVRewriteDisplay';

export default function CVScorePage() {
  const [cvText, setCvText] = useState('');
  const [score, setScore] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  // New state variables for CV rewrite
  const [targetRole, setTargetRole] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteResult, setRewriteResult] = useState<any>(null);
  const [isScoringRewritten, setIsScoringRewritten] = useState(false);
  const [newScore, setNewScore] = useState('');
  const [scoreResultsCollapsed, setScoreResultsCollapsed] = useState(false);

  // Simple cache for CV scores to ensure consistency
  const [cvScoreCache, setCvScoreCache] = useState<Map<string, string>>(new Map());

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
        
        await updateDoc(doc(db, 'users', user.uid), updateData);
      }
    } catch (err) {
      console.error('CV Score Error:', err);
      setError('Failed to get CV score. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRewrite = async () => {
    if (!user) {
      setError('Please log in to use the CV rewrite feature.');
      return;
    }

    if (!cvText.trim() || !score) {
      setError('Please analyze your CV first before requesting a rewrite.');
      return;
    }

    // FRONTEND WORD COUNT VALIDATION FOR REWRITE
    const wordCount = cvText.trim().split(/\s+/).length;
    
    if (wordCount < 10) {
      setError('CV is too short. Please provide at least 10 words for evaluation.');
      return;
    }
    
    if (wordCount > 1500) {
      setError('CV is too long. Maximum allowed is 1500 words. Please shorten your CV to focus on the most relevant information.');
      return;
    }

    setIsRewriting(true);
    setError('');

    try {
      const res = await authenticatedFetch('/api/cv-rewrite', {
        method: 'POST',
        body: JSON.stringify({ 
          cvText: cvText.trim(), 
          scoreFeedback: score,
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
      setError('Failed to rewrite CV. Please try again.');
    } finally {
      setIsRewriting(false);
    }
  };

  const handleScoreRewritten = async () => {
    if (!user || !rewriteResult) {
      setError('Please log in and generate a rewrite first.');
      return;
    }

    setIsScoringRewritten(true);
    setError('');

    try {
      // Use the unified scoring endpoint for rewritten CVs
      // Include the rewrite ID for perfect consistency
      const res = await authenticatedFetch('/api/score', {
        method: 'POST',
        body: JSON.stringify({ 
          cvText: rewriteResult.sections.rewrittenCV,
          guest: false,
          isRewrittenCV: true,
          originalScore: extractNumericalScore(score),
          rewriteId: rewriteResult.sections.rewriteId // Pass the rewrite ID for consistency
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
      
      await updateDoc(doc(db, 'users', user.uid), updateData);
      
      // Log debugging information
      console.log('Scoring Debug Info:', {
        originalScore: score,
        rewrittenCVLength: rewriteResult.sections.rewrittenCV.length,
        newScore: data.score,
        numericalScore,
        cvHash: data.cvHash
      });
      
      // Show improvement confirmation
      const originalScoreNumber = extractNumericalScore(score);
      if (originalScoreNumber && numericalScore) {
        const improvement = numericalScore - originalScoreNumber;
        if (improvement > 0) {
          console.log(`✅ CV improved by ${improvement} points!`);
        } else if (improvement === 0) {
          console.log(`➡️ CV maintained same score`);
        }
      }
    } catch (err) {
      console.error('Score Rewritten CV Error:', err);
      setError('Failed to score rewritten CV. Please try again.');
    } finally {
      setIsScoringRewritten(false);
    }
  };

  // Helper function to get previous CV score from Firestore
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

  // Helper function to check if current CV is similar to previous one
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

  // Helper function to extract numerical score from score string
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

  const clearAll = () => {
    setCvText('');
    setScore('');
    setFile(null);
    setError('');
    setTargetRole('');
    setRewriteResult(null);
    setNewScore('');
    // Clear the cache to allow fresh scoring
    setCvScoreCache(new Map());
  };

  const clearCache = () => {
    setCvScoreCache(new Map());
    console.log('CV score cache cleared');
  };

  // Helper function to safely show CV hash preview
  const getCVHashPreview = (text: string) => {
    if (!text.trim()) return 'None';
    
    try {
      // Create a simple hash-like preview using the first few characters
      const normalized = text.trim().toLowerCase();
      const preview = normalized.substring(0, 20);
      return preview + (normalized.length > 20 ? '...' : '');
    } catch (error) {
      return 'Error generating preview';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black">
      <Head>
        <title>Gradual CV Scorer</title>
      </Head>
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="mb-6">
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                AI <span className="text-blue-400">CV Scorer</span>
              </h1>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Get instant AI-powered feedback on your CV with detailed analysis, improvement suggestions, and AI-powered rewriting
              </p>
            </div>
          </div>

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

              {/* Target Role Input */}
              {user && (
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <Target className="h-6 w-6 text-blue-400 mr-3" />
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
                    Specify a target role to get more tailored feedback and rewrite suggestions
                  </p>
                </div>
              )}

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
                  onClick={clearAll}
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

          {/* CV Rewrite Section */}
          {score && user && (
            <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl mb-6">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <Edit3 className="h-6 w-6 text-purple-400 mr-3" />
                  <h2 className="text-2xl font-semibold text-white">AI CV Rewrite</h2>
                </div>
                
                <p className="text-gray-300 text-lg mb-6">
                  Get an AI-powered rewrite of your CV based on the feedback above. 
                  The AI will improve your CV&apos;s language, structure, and impact while maintaining your core information.
                </p>

                {!rewriteResult ? (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        onClick={handleRewrite}
                        disabled={isRewriting || !cvText.trim()}
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
                    </div>
                    
                    <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                      <h3 className="text-white font-semibold mb-2">What the AI will improve:</h3>
                      <ul className="text-gray-300 space-y-1 text-sm">
                        <li>• Language clarity and professional tone</li>
                        <li>• Action verbs and quantifiable achievements</li>
                        <li>• ATS-friendly formatting and keywords</li>
                        <li>• Structure and organization</li>
                        <li>• Impact and persuasiveness</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-400/30 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-purple-300">CV Rewrite Complete!</h3>
                      <Button
                        onClick={() => setRewriteResult(null)}
                        variant="outline"
                        size="sm"
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reset
                      </Button>
                    </div>
                    <p className="text-gray-200">
                      Your CV has been rewritten! Scroll down to see the improved version and compare scores.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* CV Rewrite Display */}
          {rewriteResult && (
            <CVRewriteDisplay
              rewriteResult={rewriteResult}
              onScoreRewritten={handleScoreRewritten}
              isScoringRewritten={isScoringRewritten}
              newScore={newScore}
              originalScore={score}
            />
          )}

        </div>
      </div>
    </div>
  );
}
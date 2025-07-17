'use client';

import Head from 'next/head';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '../../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  TrendingUp, 
  Upload, 
  FileText, 
  Brain, 
  CheckCircle, 
  X, 
  Loader2,
  Download,
  Star,
  BarChart3
} from 'lucide-react';

export default function CVScorePage() {
  const [cvText, setCvText] = useState('');
  const [score, setScore] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

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

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvText: cvText.trim(), guest: !user }),
      });

      if (!res.ok) {
        throw new Error('Failed to get score');
      }

      const data = await res.json();
      setScore(data.score);

      // Only save to Firestore if user is logged in
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          cvScore: data.score,
          cvScoreTimestamp: new Date(),
        });
      }
    } catch (err) {
      setError('Failed to get CV score. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearAll = () => {
    setCvText('');
    setScore('');
    setFile(null);
    setError('');
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
                Get instant AI-powered feedback on your CV with detailed analysis and improvement suggestions
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
                  <h2 className="text-xl font-semibold text-white">CV Text</h2>
                </div>
                
                <textarea
                  className="w-full h-60 p-4 rounded-lg bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 resize-none"
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                  placeholder="Paste your CV text here or upload a PDF above..."
                  disabled={isProcessingPdf}
                />
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
                  onClick={handleSubmit}
                  disabled={isLoading || isProcessingPdf || !cvText.trim()}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Analyzing CV...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Brain className="h-5 w-5 mr-2" />
                      Analyze CV
                    </div>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300"
                  onClick={clearAll}
                  disabled={isLoading || isProcessingPdf}
                >
                  <X className="h-5 w-5 mr-2" />
                  Clear All
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          {score && (
            <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <BarChart3 className="h-6 w-6 text-green-400 mr-3" />
                  <h2 className="text-2xl font-semibold text-white">AI Evaluation Results</h2>
                </div>
                <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-400/30 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <Star className="h-5 w-5 text-yellow-400 mr-2" />
                    <span className="text-green-400 font-medium">Analysis Complete</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
                    <p className="text-gray-200 whitespace-pre-line leading-relaxed">
                      {score}
                    </p>
                  </div>
                  {user ? (
                    <div className="mt-4 flex items-center text-gray-400 text-sm">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Results saved to your profile
                    </div>
                  ) : (
                    <div className="mt-4 text-center">
                      <p className="text-blue-300 text-sm mb-2 font-medium">Want detailed suggestions and to save your results?</p>
                      <div className="flex justify-center gap-2">
                        <a href="/register" className="underline text-blue-400 hover:text-blue-300 transition-colors">Create an account</a>
                        <span className="text-gray-400">or</span>
                        <a href="/login" className="underline text-blue-400 hover:text-blue-300 transition-colors">Sign in</a>
                        <span className="text-gray-400">to unlock more!</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
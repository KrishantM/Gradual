'use client';

import Head from 'next/head';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '../../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

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
    if (!user) {
      setError('You must be logged in to save your CV score.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvText: cvText.trim() }),
      });

      if (!res.ok) {
        throw new Error('Failed to get score');
      }

      const data = await res.json();
      setScore(data.score);

      // Save the score to Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        cvScore: data.score,
        cvScoreTimestamp: new Date(),
      });
    } catch (err) {
      setError('Failed to get CV score or save it. Please try again.');
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
    <div className="min-h-screen p-8 bg-gray-50">
      <Head>
        <title>neXtwork CV Scorer</title>
      </Head>
      <main className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">neXtwork CV Scorer</h1>
          <p className="text-gray-600">Upload your CV or paste the text to get an AI-powered evaluation</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload PDF CV
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="pdf-upload"
                disabled={isProcessingPdf}
              />
              <label htmlFor="pdf-upload" className="cursor-pointer">
                <div className="text-gray-600">
                  {isProcessingPdf ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                      Processing PDF...
                    </div>
                  ) : (
                    <>
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="text-sm">Click to upload PDF or drag and drop</p>
                      <p className="text-xs text-gray-500 mt-1">Maximum file size: 10MB</p>
                    </>
                  )}
                </div>
              </label>
            </div>
            {file && (
              <div className="mt-2 text-sm text-green-600">
                ✓ {file.name} uploaded successfully
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CV Text
            </label>
            <textarea
              className="w-full h-60 border border-gray-300 p-4 text-base rounded-md shadow-sm text-black bg-white resize-y focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              placeholder="Paste your CV text here or upload a PDF above..."
              disabled={isProcessingPdf}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={isLoading || isProcessingPdf || !cvText.trim()}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analyzing CV...
                </div>
              ) : (
                'Analyze CV'
              )}
            </button>
            
            <button
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg shadow-md transition duration-200"
              onClick={clearAll}
              disabled={isLoading || isProcessingPdf}
            >
              Clear All
            </button>
          </div>
        </div>

        {score && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-blue-600 mb-4">AI Evaluation Results</h2>
            <div className="text-gray-800 bg-gray-50 p-4 rounded-md whitespace-pre-line">
              {score}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
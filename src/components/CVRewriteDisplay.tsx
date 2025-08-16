'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Edit3, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  Loader2,
  TrendingUp,
  Star,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface CVRewriteDisplayProps {
  rewriteResult: any;
  onScoreRewritten: () => void;
  isScoringRewritten: boolean;
  newScore: string;
  originalScore: string;
}

export default function CVRewriteDisplay({
  rewriteResult,
  onScoreRewritten,
  isScoringRewritten,
  newScore,
  originalScore
}: CVRewriteDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'changes' | 'cv'>('summary');
  const [cvRewriteCollapsed, setCvRewriteCollapsed] = useState(false);
  const [scoreComparisonCollapsed, setScoreComparisonCollapsed] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const downloadCV = () => {
    if (!rewriteResult?.sections?.rewrittenCV) return;
    
    const element = document.createElement('a');
    const file = new Blob([rewriteResult.sections.rewrittenCV], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'rewritten-cv.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const extractScore = (scoreText: string, pattern: RegExp) => {
    const match = scoreText.match(pattern);
    return match ? match[1] : 'N/A';
  };

  const originalScoreValue = extractScore(originalScore, /Overall Score \(0–100\): (\d+)/);
  const newScoreValue = extractScore(newScore, /NEW SCORE \(0–100\): (\d+)/);
  const scoreImprovement = newScoreValue !== 'N/A' && originalScoreValue !== 'N/A' 
    ? parseInt(newScoreValue) - parseInt(originalScoreValue) 
    : 0;

  return (
    <div className="space-y-6">
      {/* CV Rewrite Results */}
      <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Edit3 className="h-6 w-6 text-purple-400 mr-3" />
              <h2 className="text-2xl font-semibold text-white">AI Rewritten CV</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white p-2"
              onClick={() => setCvRewriteCollapsed(!cvRewriteCollapsed)}
            >
              {cvRewriteCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>

          {!cvRewriteCollapsed && (
            <>
              {/* Tab Navigation */}
              <div className="flex space-x-1 mb-6 bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'summary'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Summary
                </button>
                <button
                  onClick={() => setActiveTab('changes')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'changes'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Changes
                </button>
                <button
                  onClick={() => setActiveTab('cv')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'cv'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Rewritten CV
                </button>
              </div>

              {/* Tab Content */}
              <div className="min-h-[300px]">
                {/* Summary Tab */}
                {activeTab === 'summary' && rewriteResult.sections.improvementSummary && (
                  <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-400/30 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-purple-300 mb-4 flex items-center">
                      <Star className="h-5 w-5 mr-2" />
                      Improvement Summary
                    </h3>
                    <p className="text-gray-200 text-lg leading-relaxed">
                      {rewriteResult.sections.improvementSummary}
                    </p>
                  </div>
                )}

                {/* Changes Tab */}
                {activeTab === 'changes' && rewriteResult.sections.changesMade && (
                  <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-400/30 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-300 mb-4 flex items-center">
                      <RefreshCw className="h-5 w-5 mr-2" />
                      Changes Made
                    </h3>
                    <div className="text-gray-200 whitespace-pre-line leading-relaxed">
                      {rewriteResult.sections.changesMade}
                    </div>
                  </div>
                )}

                {/* CV Tab */}
                {activeTab === 'cv' && rewriteResult.sections.rewrittenCV && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">Rewritten CV</h3>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => copyToClipboard(rewriteResult.sections.rewrittenCV)}
                          variant="outline"
                          size="sm"
                          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 mr-2" />
                          ) : (
                            <Copy className="h-4 w-4 mr-2" />
                          )}
                          {copied ? 'Copied!' : 'Copy'}
                        </Button>
                        <Button
                          onClick={downloadCV}
                          variant="outline"
                          size="sm"
                          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                      <p className="text-gray-200 whitespace-pre-line leading-relaxed">
                        {rewriteResult.sections.rewrittenCV}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Score Rewritten CV Button */}
              <div className="text-center mt-8">
                <Button
                  onClick={onScoreRewritten}
                  disabled={isScoringRewritten}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  {isScoringRewritten ? (
                    <div className="flex items-center">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Scoring Rewritten CV...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <RefreshCw className="h-5 w-5 mr-2" />
                      Score Rewritten CV
                    </div>
                  )}
                </Button>
                <p className="text-gray-400 text-sm mt-2">
                  Compare the new score with your original CV
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Score Comparison */}
      {newScore && (
        <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <TrendingUp className="h-6 w-6 text-green-400 mr-3" />
                <h2 className="text-2xl font-semibold text-white">Score Comparison</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white p-2"
                onClick={() => setScoreComparisonCollapsed(!scoreComparisonCollapsed)}
              >
                {scoreComparisonCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            </div>

            {!scoreComparisonCollapsed && (
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-400/30 rounded-lg p-6">
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  {/* Original Score */}
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 text-center">
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">Original CV</h3>
                    <div className="text-3xl font-bold text-blue-400">{originalScoreValue}</div>
                    <p className="text-gray-400 text-sm">/ 100</p>
                  </div>
                  
                  {/* Score Improvement */}
                  <div className="bg-white/10 backdrop-blur-sm border border-white-20 rounded-lg p-4 text-center">
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">Improvement</h3>
                    <div className={`text-3xl font-bold ${scoreImprovement >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {scoreImprovement >= 0 ? '+' : ''}{scoreImprovement}
                    </div>
                    <p className="text-gray-400 text-sm">points</p>
                    {scoreImprovement > 0 && (
                      <div className="mt-2 text-xs text-green-300 bg-green-500/20 px-2 py-1 rounded">
                        ✅ Improved!
                      </div>
                    )}
                  </div>
                  
                  {/* New Score */}
                  <div className="bg-white/10 backdrop-blur-sm border border-white-20 rounded-lg p-4 text-center">
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">Rewritten CV</h3>
                    <div className="text-3xl font-bold text-green-400">{newScoreValue}</div>
                    <p className="text-gray-400 text-sm">/ 100</p>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
                  <p className="text-gray-200 whitespace-pre-line leading-relaxed">
                    {newScore}
                  </p>
                </div>
                
                <div className="mt-4 flex items-center text-gray-400 text-sm">
                  <Check className="h-4 w-4 mr-2" />
                  Comparison complete - see the detailed breakdown above
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

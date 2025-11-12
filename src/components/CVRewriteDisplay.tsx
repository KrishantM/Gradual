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
  ChevronUp,
  BarChart3,
  Target,
  Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Enhanced Rewritten Score Display Component
const EnhancedRewrittenScoreDisplay = ({ score }: { score: string }) => {
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
  
  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'from-green-400 to-emerald-500';
    if (percentage >= 60) return 'from-emerald-400 to-green-500';
    if (percentage >= 40) return 'from-green-400 to-lime-500';
    return 'from-lime-400 to-yellow-500';
  };

  const getOverallColor = (score: number) => {
    if (score >= 80) return 'from-green-400 to-emerald-500';
    if (score >= 60) return 'from-emerald-400 to-green-500';
    if (score >= 40) return 'from-green-400 to-lime-500';
    return 'from-lime-400 to-yellow-500';
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
        <div className="relative inline-block">
          <motion.div
            animate={{ 
              boxShadow: [
                "0 0 20px rgba(34, 197, 94, 0.3)",
                "0 0 40px rgba(34, 197, 94, 0.6)",
                "0 0 20px rgba(34, 197, 94, 0.3)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`bg-gradient-to-r ${getOverallColor(overallScore)} rounded-full p-1`}
          >
            <div className="bg-slate-900/80 backdrop-blur-sm rounded-full px-8 py-4">
              <div className="text-4xl font-bold text-white mb-2">
                {overallScore}
              </div>
              <div className="text-sm text-gray-300">Overall Score</div>
            </div>
          </motion.div>
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
          className="bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-lime-500/10 border border-green-400/30 rounded-lg p-4"
        >
          <div className="flex items-center mb-3">
            <Target className="h-5 w-5 text-green-400 mr-2" />
            <h3 className="text-lg font-semibold text-white">Areas to Improve</h3>
          </div>
          <div className="text-gray-200 leading-relaxed">
            {score.split('5. Areas to improve:')[1]?.trim() || 'Focus on enhancing professional language, adding quantifiable achievements, and improving overall structure.'}
          </div>
        </motion.div>

        {/* Detailed Category Feedback */}
        {sections.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="bg-gradient-to-r from-slate-800/20 to-slate-700/20 backdrop-blur-sm border border-slate-600/30 rounded-lg p-4"
          >
            <div className="flex items-center mb-4">
              <Brain className="h-5 w-5 text-green-400 mr-2" />
              <h3 className="text-lg font-semibold text-white">Scoring Breakdown</h3>
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
                    className="bg-gradient-to-r from-green-500/5 to-emerald-500/5 border border-green-400/10 rounded-lg p-3"
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getScoreColor(section.score, section.maxScore)} mt-1.5 flex-shrink-0`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-white text-sm">{section.category}</h4>
                          <span className="text-2xl font-bold text-white">{section.score}/{section.maxScore}</span>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">{feedback}</p>
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
    if (!scoreText || typeof scoreText !== 'string') return 'N/A';
    const match = scoreText.match(pattern);
    return match ? match[1] : 'N/A';
  };

  const originalScoreValue = extractScore(originalScore, /Overall Score \(0–100\): (\d+)/);
  // Both original and new scores use the same format: "Overall Score (0–100): X"
  const newScoreValue = extractScore(newScore, /Overall Score \(0–100\): (\d+)/);
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
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Score Rewritten CV
                    </div>
                  )}
                </Button>
                <p className="text-gray-400 text-sm mt-2">
                  Get your AI-enhanced CV scored and saved to your profile
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Rewritten CV Score */}
      {newScore && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Card className="bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-lime-500/10 backdrop-blur-md border-green-400/20 shadow-2xl overflow-hidden">
            <CardContent 
              className="cursor-pointer hover:bg-white/10 transition-all duration-300 p-6 relative"
              onClick={() => setScoreComparisonCollapsed(!scoreComparisonCollapsed)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-6 w-6 text-green-400" />
                  <h2 className="text-xl text-white font-bold">Rewritten CV Score</h2>
                </div>
                <motion.div
                  animate={{ 
                    scale: scoreComparisonCollapsed ? 1 : [1, 1.2, 1]
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {scoreComparisonCollapsed ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronUp className="h-5 w-5 text-gray-400" />}
                </motion.div>
              </div>
            </CardContent>
            <AnimatePresence>
              {!scoreComparisonCollapsed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  <CardContent className="p-6">
                    <EnhancedRewrittenScoreDisplay score={newScore} />
                    
                    <div className="mt-6 flex items-center justify-center text-green-400 text-sm">
                      <Check className="h-4 w-4 mr-2" />
                      Your rewritten CV has been scored and saved to your profile
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

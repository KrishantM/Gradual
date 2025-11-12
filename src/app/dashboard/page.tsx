'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '../../../lib/firebase';
import { doc, getDoc, getDocs, collection, query, where, updateDoc, arrayRemove } from 'firebase/firestore';
import { UserRoleService } from '@/lib/user-role';
import Link from 'next/link';
import ToDoList from '@/components/ToDoList';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Home, 
  User, 
  Brain, 
  CheckCircle, 
  TrendingUp, 
  Calendar, 
  LogOut, 
  Edit, 
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  Briefcase,
  MapPin,
  Star,
  ExternalLink,
  BarChart3,
  Settings,
  Info,
  Trash2,
  X,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Animated components for dashboard
const AnimatedCard = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ 
        y: -5, 
        scale: 1.02,
        transition: { duration: 0.3 }
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const LoadingSpinner = () => (
  <motion.div 
    className="flex items-center justify-center"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    >
      <Loader2 className="h-8 w-8 text-blue-400" />
    </motion.div>
  </motion.div>
)

const PulseCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <motion.div
    className={className}
    animate={{ 
      boxShadow: [
        "0 0 0px rgba(59, 130, 246, 0)",
        "0 0 20px rgba(59, 130, 246, 0.3)",
        "0 0 0px rgba(59, 130, 246, 0)"
      ]
    }}
    transition={{ duration: 2, repeat: Infinity }}
  >
    {children}
  </motion.div>
)

interface SavedOpportunity {
  id: string;
  title: string;
  description: string;
  location: string;
  company: string;
  url: string;
  type: 'internship' | 'job';
  category: string;
  created: string;
  salary_min?: number;
  salary_max?: number;
  source: string;
  score: number;
}

function extractOverallScore(scoreText: string | number | null): string | null {
  if (!scoreText) return null;
  
  // If scoreText is already a number, return it as a string
  if (typeof scoreText === 'number') {
    return scoreText.toString();
  }
  
  // If scoreText is a string, try to extract the score from the API response format
  if (typeof scoreText === 'string') {
    // Add null check to prevent the match error
    if (!scoreText || scoreText.trim() === '') return null;
    
    const match = scoreText.match(/Overall Score \(0–100\):\s*(\d+)/);
    return match ? match[1] : scoreText; // Return extracted score or original text
  }
  
  return null;
}

function formatDate(date: any) {
  if (!date) return '';
  if (typeof date === 'string') date = new Date(date);
  if (date.toDate) date = date.toDate(); // Firestore Timestamp
  return date.toLocaleDateString();
}

function formatOpportunityDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'Today';
  if (diffDays <= 7) return `${diffDays} days ago`;
  if (diffDays <= 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

// Enhanced CV Score Display Component for Dashboard
const EnhancedDashboardScoreDisplay = ({ score, analysis }: { score: string | number | null, analysis: string | null }) => {
  const [showDetails, setShowDetails] = useState(false);
  const parseScore = (scoreText: string | number | null) => {
    if (!scoreText) return { overall: null, sections: [] };
    
    let text = typeof scoreText === 'number' ? scoreText.toString() : scoreText;
    
    // Extract overall score - try multiple patterns
    let overall = null;
    
    // Pattern 1: "Overall Score (0–100): 85"
    const overallMatch1 = text.match(/Overall Score \(0–100\):\s*(\d+)/);
    if (overallMatch1) {
      overall = parseInt(overallMatch1[1]);
    }
    
    // Pattern 2: Just a number (if score is stored as number)
    if (!overall && typeof scoreText === 'number') {
      overall = scoreText;
    }
    
    // Pattern 3: Extract number from any text
    if (!overall) {
      const numberMatch = text.match(/(\d+)/);
      if (numberMatch) {
        const num = parseInt(numberMatch[1]);
        if (num >= 0 && num <= 100) {
          overall = num;
        }
      }
    }
    
    // Extract category scores and feedback
    const sections: Array<{name: string, score: number, feedback: string}> = [];
    
    const categoryPatterns = [
      { name: 'Content Quality', pattern: /1\. Content Quality:\s*(\d+)/ },
      { name: 'Structure & Format', pattern: /2\. Structure & Format:\s*(\d+)/ },
      { name: 'Professional Language', pattern: /3\. Professional Language:\s*(\d+)/ },
      { name: 'Achievements & Impact', pattern: /4\. Achievements & Impact:\s*(\d+)/ }
    ];
    
    categoryPatterns.forEach(category => {
      const match = text.match(category.pattern);
      if (match) {
        const score = parseInt(match[1]);
        sections.push({ name: category.name, score, feedback: '' });
      }
    });
    
    return { overall, sections };
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getOverallColor = (score: number) => {
    if (score >= 80) return 'from-emerald-500/20 to-emerald-600/20 border-emerald-400/30';
    if (score >= 60) return 'from-blue-500/20 to-cyan-500/20 border-blue-400/30';
    if (score >= 40) return 'from-yellow-500/20 to-orange-500/20 border-yellow-400/30';
    return 'from-red-500/20 to-pink-500/20 border-red-400/30';
  };

  const getCategoryFeedback = (analysis: string | null, categoryName: string) => {
    if (!analysis) return '';
    
    const lines = analysis.split('\n');
    let inCategory = false;
    let feedback = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.includes(categoryName)) {
        inCategory = true;
        continue;
      }
      
      if (inCategory && line && !line.match(/^\d+\./)) {
        feedback += line + ' ';
      } else if (inCategory && line.match(/^\d+\./)) {
        break;
      }
    }
    
    return feedback.trim();
  };

  const { overall, sections } = parseScore(score);
  const areasToImprove = analysis?.split('5. Areas to improve:')[1]?.trim() || '';

  // If we can't parse a score, show a fallback
  if (!overall) {
    return (
      <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <span className="text-6xl font-extrabold text-blue-400">
              {typeof score === 'number' ? score : '—'}
            </span>
            <div className="text-left">
              <p className="text-gray-300 text-sm">Overall Score</p>
              <p className="text-gray-400 text-xs">out of 100</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-auto min-w-0 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 whitespace-nowrap px-3 py-2 text-sm"
            onClick={() => setShowDetails((v) => !v)}
          >
            {showDetails ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                View Details
              </>
            )}
          </Button>
        </div>
        
        {showDetails && analysis && (
          <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
            <h4 className="text-white font-semibold mb-3">CV Analysis</h4>
            <p className="text-gray-200 whitespace-pre-line leading-relaxed text-sm">
              {analysis}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Score - Always Visible */}
      <motion.div 
        className={`bg-gradient-to-br ${getOverallColor(overall)} backdrop-blur-md border rounded-lg p-6`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <span className={`text-6xl font-extrabold ${getScoreColor(overall)}`}>
              {overall}
            </span>
            <div className="text-left">
              <p className="text-gray-300 text-sm">Overall Score</p>
              <p className="text-gray-400 text-xs">out of 100</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-auto min-w-0 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 whitespace-nowrap px-3 py-2 text-sm"
            onClick={() => setShowDetails((v) => !v)}
          >
            {showDetails ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                View Details
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {/* Collapsible Details */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Areas to Improve */}
            {areasToImprove && (
              <motion.div 
                className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-md border border-green-400/30 rounded-lg p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="flex items-center mb-4">
                  <Target className="h-6 w-6 text-green-400 mr-3" />
                  <h3 className="text-xl font-semibold text-white">Areas to Improve</h3>
                </div>
                <p className="text-gray-200 leading-relaxed">
                  {areasToImprove}
                </p>
              </motion.div>
            )}

            {/* Scoring Breakdown */}
            {sections.length > 0 && (
              <motion.div 
                className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-lg p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="flex items-center mb-6">
                  <Brain className="h-6 w-6 text-blue-400 mr-3" />
                  <h3 className="text-xl font-semibold text-white">Scoring Breakdown</h3>
                </div>
                <div className="grid gap-3">
                  {sections.map((section, index) => (
                    <motion.div
                      key={section.name}
                      className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-lg p-3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium">{section.name}</h4>
                        <div className={`text-2xl font-bold ${getScoreColor(section.score)}`}>
                          {section.score}
                        </div>
                      </div>
                      {getCategoryFeedback(analysis, section.name) && (
                        <p className="text-gray-300 text-sm">
                          {getCategoryFeedback(analysis, section.name)}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [suggestions, setSuggestions] = useState('');
  const [name, setName] = useState('');
  const [cvScore, setCvScore] = useState<string | number | null>(null);
  const [cvScoreTimestamp, setCvScoreTimestamp] = useState<any>(null);
  const [cvScoreAnalysis, setCvScoreAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedOpportunities, setSavedOpportunities] = useState<SavedOpportunity[]>([]);
  const [opportunitiesLoading, setOpportunitiesLoading] = useState(false);
  const [unstarringLoading, setUnstarringLoading] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [clearingScore, setClearingScore] = useState(false);
  const [fetchingJobs, setFetchingJobs] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Check user role and redirect if necessary
    const checkUserRole = async () => {
      try {
        console.log('Checking user role for:', user.email);
        const userRole = await UserRoleService.getUserRole(user);
        console.log('Detected user role:', userRole);
        
        if (userRole.role === 'recruiter') {
          console.log('Redirecting recruiter to recruiter dashboard');
          // Redirect recruiters to their dashboard
          router.push('/recruiter-dashboard');
          return;
        }
        
        console.log('Continuing with student dashboard');
        // Continue with student dashboard logic
        await fetchData();
      } catch (error) {
        console.error('Error checking user role:', error);
        // Fallback to student dashboard
        await fetchData();
      }
    };

    const fetchData = async () => {
      try {
        setHasError(false);
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setName(userData.fullName || '');
          
          // Load CV score data
          const rawCvScore = userData.cvScore;
          if (rawCvScore !== null && rawCvScore !== undefined) {
            setCvScore(rawCvScore);
          } else {
            setCvScore(null);
          }
          
          const rawCvScoreTimestamp = userData.cvScoreTimestamp;
          if (rawCvScoreTimestamp && (rawCvScoreTimestamp.toDate || rawCvScoreTimestamp instanceof Date)) {
            setCvScoreTimestamp(rawCvScoreTimestamp);
          } else {
            setCvScoreTimestamp(null);
          }
          
          // Load CV analysis text if available
          const rawCvScoreAnalysis = userData.cvScoreAnalysis || userData.cvText;
          if (rawCvScoreAnalysis && typeof rawCvScoreAnalysis === 'string') {
            setCvScoreAnalysis(rawCvScoreAnalysis);
          } else {
            setCvScoreAnalysis(null);
          }
          
          // Fetch saved opportunities
          const savedIds = userData.savedOpportunities || [];
          if (savedIds.length > 0) {
            await fetchSavedOpportunities(savedIds);
          }
        }

        try {
          const suggRef = doc(db, 'suggestions', user.uid);
          const suggSnap = await getDoc(suggRef);
          if (suggSnap.exists()) {
            setSuggestions(suggSnap.data().suggestions);
          }
        } catch (suggErr) {
          console.warn('Could not load suggestions:', suggErr);
          // Don't break the entire dashboard if suggestions fail
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
        setHasError(true);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [user, router]);

  const fetchSavedOpportunities = async (savedIds: string[]) => {
    setOpportunitiesLoading(true);
    try {
      const userRef = doc(db, 'users', user!.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const savedOpportunitiesData = userData.savedOpportunitiesData || [];
        
        // Filter to only include opportunities that are still in the savedIds array
        const validOpportunities = savedOpportunitiesData.filter((opp: SavedOpportunity) => 
          savedIds.includes(opp.id)
        );
        
        setSavedOpportunities(validOpportunities);
      }
    } catch (error) {
      console.error('Error fetching saved opportunities:', error);
    } finally {
      setOpportunitiesLoading(false);
    }
  };

  const refreshDashboard = async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setName(userData.fullName || '');
        
        // Load CV score data
        const rawCvScore = userData.cvScore;
        if (rawCvScore !== null && rawCvScore !== undefined) {
          setCvScore(rawCvScore);
        } else {
          setCvScore(null);
        }
        
        const rawCvScoreTimestamp = userData.cvScoreTimestamp;
        if (rawCvScoreTimestamp && (rawCvScoreTimestamp.toDate || rawCvScoreTimestamp instanceof Date)) {
          setCvScoreTimestamp(rawCvScoreTimestamp);
        } else {
          setCvScoreTimestamp(null);
        }
        
        // Load CV analysis text if available
        const rawCvScoreAnalysis = userData.cvScoreAnalysis || userData.cvText;
        if (rawCvScoreAnalysis && typeof rawCvScoreAnalysis === 'string') {
          setCvScoreAnalysis(rawCvScoreAnalysis);
        } else {
          setCvScoreAnalysis(null);
        }
        
        // Fetch saved opportunities
        const savedIds = userData.savedOpportunities || [];
        if (savedIds.length > 0) {
          await fetchSavedOpportunities(savedIds);
        }
      }
    } catch (err) {
      console.error('Error refreshing dashboard:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const clearCVScore = async () => {
    if (!user) return;
    
    setClearingScore(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        cvScore: null,
        cvScoreTimestamp: null,
        cvScoreAnalysis: null,
        cvScoreBreakdown: null,
        cvText: null,
        uploadedCVName: null
      });
      
      // Clear local state
      setCvScore(null);
      setCvScoreTimestamp(null);
      setCvScoreAnalysis(null);
      
      console.log('CV score cleared successfully');
    } catch (error) {
      console.error('Error clearing CV score:', error);
      alert('Failed to clear CV score. Please try again.');
    } finally {
      setClearingScore(false);
    }
  };

  const unstarOpportunity = async (opportunityId: string) => {
    if (!user) return;
    
    setUnstarringLoading(opportunityId);
    try {
      const userRef = doc(db, 'users', user.uid);
      
      // Find the opportunity data to remove
      const opportunityToRemove = savedOpportunities.find(opp => opp.id === opportunityId);
      
      await updateDoc(userRef, {
        savedOpportunities: arrayRemove(opportunityId),
        savedOpportunitiesData: opportunityToRemove ? arrayRemove(opportunityToRemove) : []
      });
      
      // Remove from local state
      setSavedOpportunities(prev => prev.filter(opp => opp.id !== opportunityId));
    } catch (error) {
      console.error('Error unstarring opportunity:', error);
      alert('Failed to remove opportunity');
    } finally {
      setUnstarringLoading(null);
    }
  };

  const fetchNewJobs = async () => {
    if (!user) return;
    
    setFetchingJobs(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/jobs/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          limit: 20,
          country: 'nz'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      
      const result = await response.json();
      
      if (result.jobsAdded > 0) {
        alert(`Successfully fetched ${result.jobsAdded} new job opportunities!`);
        // Refresh the dashboard to show any new opportunities
        await refreshDashboard();
      } else {
        alert('No new job opportunities found at this time.');
      }
    } catch (error) {
      console.error('Error fetching new jobs:', error);
      alert('Failed to fetch new jobs. Please try again.');
    } finally {
      setFetchingJobs(false);
    }
  };

  if (loading || !user) return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 1, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <Loader2 className="h-8 w-8 text-blue-400 mx-auto mb-4" />
        </motion.div>
        <motion.p 
          className="text-gray-300"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Loading your dashboard<span className="loading-dots"></span>
        </motion.p>
      </motion.div>
    </motion.div>
  );

  if (hasError) {
    return (
      <motion.div 
        className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              rotate: { duration: 1, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <Loader2 className="h-12 w-12 text-red-400 mx-auto mb-4" />
          </motion.div>
          <motion.p 
            className="text-gray-300 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Failed to load your dashboard. Please try again later.
          </motion.p>
          {user && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button onClick={refreshDashboard} className="bg-red-600 hover:bg-red-700">
                Refresh Dashboard
              </Button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6">
              <motion.h1 
                className="text-4xl lg:text-5xl font-bold text-white mb-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Welcome{name && `, ${name}`}! 
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  👋
                </motion.span>
              </motion.h1>
              <motion.p 
                className="text-gray-300 text-lg max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                Your personalized career dashboard with insights, suggestions, and progress tracking
              </motion.p>
            </div>
          </motion.div>

          {/* CV Score Section */}
          <AnimatedCard delay={0.6}>
            <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl mb-8 hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-6 w-6 text-blue-400 mr-3" />
                    <h2 className="text-2xl font-semibold text-white">Your Latest CV Score</h2>
                  </div>
                  {cvScore && (
                    <Button
                      onClick={clearCVScore}
                      disabled={clearingScore}
                      variant="outline"
                      size="sm"
                      className="bg-red-500/10 border-red-400 text-red-400 hover:bg-red-500/20 hover:text-white transition-all duration-300"
                    >
                      {clearingScore ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      {clearingScore ? 'Clearing...' : 'Clear Score'}
                    </Button>
                  )}
                </div>
                
                {!cvScore ? (
                  // No CV score state
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">📄</div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No CV score saved!
                    </h3>
                    <p className="text-gray-400 mb-6">
                      Generate one now to see your CV performance analysis
                    </p>
                    <Link href="/cvscore">
                      <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Generate CV Score
                      </Button>
                    </Link>
                  </div>
                ) : (
                  // CV score exists - use enhanced display
                  <>
                    {cvScoreTimestamp && (
                      <div className="flex items-center text-gray-400 text-sm mb-6">
                        <Calendar className="h-4 w-4 mr-2" />
                        Last updated: {formatDate(cvScoreTimestamp)}
                      </div>
                    )}
                    
                    <EnhancedDashboardScoreDisplay 
                      score={cvScore} 
                      analysis={cvScoreAnalysis} 
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </AnimatedCard>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Saved Suggestions */}
            <AnimatedCard delay={0.8}>
              <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center mb-6">
                  <Sparkles className="h-6 w-6 text-blue-400 mr-3" />
                  <h2 className="text-xl font-semibold text-white">Saved Suggestions</h2>
                </div>
                
                {suggestions ? (
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
                    <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">
                      {suggestions}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Sparkles className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">
                      No saved suggestions yet
                    </p>
                    <Link href="/suggestions">
                      <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                        <Brain className="h-4 w-4 mr-2" />
                        Generate Suggestions
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
            </AnimatedCard>

            {/* To-Do List */}
            <AnimatedCard delay={1.0}>
              <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center mb-6">
                  <CheckCircle className="h-6 w-6 text-blue-400 mr-3" />
                  <h2 className="text-xl font-semibold text-white">Your Career To-Do List</h2>
                </div>
                {user && <ToDoList userId={user.uid} />}
              </CardContent>
            </Card>
            </AnimatedCard>
          </div>

          {/* Saved Opportunities Section */}
          <AnimatedCard delay={1.2}>
            <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl mb-8 hover-lift">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <div className="flex items-center">
                  <Star className="h-6 w-6 text-yellow-400 mr-3" />
                  <h2 className="text-xl sm:text-2xl font-semibold text-white">Saved Opportunities</h2>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto bg-green-600/20 border-green-400/30 text-green-300 hover:bg-green-600/30 hover:border-green-400/50"
                    onClick={fetchNewJobs}
                    disabled={fetchingJobs}
                  >
                    {fetchingJobs ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Fetch New Jobs
                      </>
                    )}
                  </Button>
                  <Link href="/suggestions" className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      Find More Opportunities
                    </Button>
                  </Link>
                </div>
              </div>

              {opportunitiesLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-4" />
                  <p className="text-gray-300">Loading saved opportunities...</p>
                </div>
              ) : savedOpportunities.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {savedOpportunities.map((opportunity) => (
                    <div
                      key={opportunity.id}
                      className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 hover:bg-white/15 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold mb-1 line-clamp-2">
                            {opportunity.title}
                          </h3>
                          <p className="text-gray-300 text-sm mb-2">{opportunity.company}</p>
                        </div>
                        <button
                          onClick={() => unstarOpportunity(opportunity.id)}
                          disabled={unstarringLoading === opportunity.id}
                          className="p-1.5 rounded-full text-yellow-400 bg-yellow-400/20 hover:bg-yellow-400/30 transition-all duration-200 ml-3"
                        >
                          {unstarringLoading === opportunity.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                          ) : (
                            <Star className="h-4 w-4 fill-current" />
                          )}
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap items-center text-gray-400 text-sm mb-3 gap-2 sm:gap-4">
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="truncate">{opportunity.location}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span className="truncate">{formatOpportunityDate(opportunity.created)}</span>
                        </div>
                        <div className="flex items-center">
                          <Briefcase className="h-3 w-3 mr-1" />
                          <span className="truncate">{opportunity.type}</span>
                        </div>
                      </div>

                      <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                        {opportunity.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 capitalize">
                          {opportunity.category}
                        </span>
                        <a
                          href={opportunity.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                        >
                          Apply Now
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">No saved opportunities yet</p>
                  <Link href="/suggestions">
                    <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Find Opportunities
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
          </AnimatedCard>

          {/* Action Buttons */}
          <AnimatedCard delay={1.4}>
            <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl hover-lift">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <Link href="/profile" className="w-full">
                  <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 h-[120px] flex flex-col justify-center">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">Edit Profile</h3>
                        <p className="text-blue-100 text-sm">Update your personal information</p>
                      </div>
                      <Edit className="h-6 w-6 text-white/80 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </Link>
                
                <Link href="/suggestions" className="w-full">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 h-[120px] flex flex-col justify-center">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">Suggestions</h3>
                        <p className="text-green-100 text-sm">Discover new career opportunities</p>
                      </div>
                      <Brain className="h-6 w-6 text-white/80 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </Link>
                
                <Link href="/cvscore" className="w-full">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 h-[120px] flex flex-col justify-center">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">CV Score</h3>
                        <p className="text-blue-100 text-sm">Get AI-powered CV analysis</p>
                      </div>
                      <BarChart3 className="h-6 w-6 text-white/80 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </Link>

                <Link href="/settings" className="w-full">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 h-[120px] flex flex-col justify-center">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">Settings</h3>
                        <p className="text-purple-100 text-sm">Manage account preferences</p>
                      </div>
                      <Settings className="h-6 w-6 text-white/80 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </Link>
                
                <div className="w-full">
                  <div className="bg-gradient-to-br from-red-500 to-pink-600 p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 h-[120px] flex flex-col justify-center cursor-pointer" onClick={logout}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">Logout</h3>
                        <p className="text-red-100 text-sm">Sign out of your account</p>
                      </div>
                      <LogOut className="h-6 w-6 text-white/80 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          </AnimatedCard>
        </div>
      </div>
    </motion.div>
  );
}

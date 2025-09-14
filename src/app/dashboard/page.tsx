'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '../../../lib/firebase';
import { doc, getDoc, getDocs, collection, query, where, updateDoc, arrayRemove } from 'firebase/firestore';
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
  X
} from 'lucide-react';

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

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [suggestions, setSuggestions] = useState('');
  const [name, setName] = useState('');
  const [cvScore, setCvScore] = useState<string | number | null>(null);
  const [cvScoreTimestamp, setCvScoreTimestamp] = useState<any>(null);
  const [cvScoreAnalysis, setCvScoreAnalysis] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
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

    fetchData();
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
      setShowDetails(false);
      
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

  const overallScore = extractOverallScore(cvScore);

  if (loading || !user) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-4" />
        <p className="text-gray-300">Loading your dashboard...</p>
      </div>
    </div>
  );

  if (hasError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-red-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Failed to load your dashboard. Please try again later.</p>
          {user && (
            <Button onClick={refreshDashboard} className="mt-4 bg-red-600 hover:bg-red-700">
              Refresh Dashboard
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="mb-6">
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                Welcome{name && `, ${name}`}! 👋
              </h1>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Your personalized career dashboard with insights, suggestions, and progress tracking
              </p>
            </div>

          </div>

          {/* CV Builder Section */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl mb-8">
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
              
              <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-lg p-6">
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
                  // CV score exists
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <span className="text-6xl font-extrabold text-blue-400">
                          {overallScore ? overallScore : '—'}
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
                    
                    {cvScoreTimestamp && (
                      <div className="flex items-center text-gray-400 text-sm mb-4">
                        <Calendar className="h-4 w-4 mr-2" />
                        Last updated: {formatDate(cvScoreTimestamp)}
                      </div>
                    )}
                    
                    {/* CV Score Analysis - Show when details are expanded */}
                    {showDetails && cvScoreAnalysis && (
                      <div className="mt-4 p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
                        <h4 className="text-white font-semibold mb-3">CV Analysis</h4>
                        <p className="text-gray-200 whitespace-pre-line leading-relaxed text-sm">
                          {cvScoreAnalysis}
                        </p>
                      </div>
                    )}
                    
                    {/* Show message when analysis is available but details are hidden */}
                    {!showDetails && cvScoreAnalysis && (
                      <div className="mt-4 text-center">
                        <div className="text-gray-400 text-sm">
                          <Info className="h-4 w-4 inline mr-2" />
                          Click &quot;View Details&quot; to see your CV analysis
                        </div>
                      </div>
                    )}
                    
                    {/* Show message when no analysis is available */}
                    {!cvScoreAnalysis && (
                      <div className="mt-4 text-center">
                        <div className="text-gray-400 text-sm">
                          <Info className="h-4 w-4 inline mr-2" />
                          CV analysis will be available after your next CV scoring
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Saved Suggestions */}
            <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
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

            {/* To-Do List */}
            <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
              <CardContent className="p-6">
                <div className="flex items-center mb-6">
                  <CheckCircle className="h-6 w-6 text-blue-400 mr-3" />
                  <h2 className="text-xl font-semibold text-white">Your Career To-Do List</h2>
                </div>
                {user && <ToDoList userId={user.uid} />}
              </CardContent>
            </Card>
          </div>

          {/* Saved Opportunities Section */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl mb-8">
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

          {/* Action Buttons */}
          <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
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
        </div>
      </div>
    </div>
  );
}

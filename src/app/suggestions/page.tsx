'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { trackEvent } from '@/lib/analytics';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Briefcase,
  Star,
  Loader2,
  RefreshCw,
  Target,
  MapPin,
  ExternalLink,
  Calendar,
  TrendingUp,
  Users,
  Heart,
  Award,
  Zap,
  GraduationCap,
  Search,
  Filter,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
  FolderPlus,
  Trash2,
  Trophy,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// Legacy interface for backward compatibility
interface LegacyOpportunity {
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

// New Opportunities Engine types
import { Opportunity as EngineOpportunity, OpportunityType } from '@/types/opportunities';

type TabType = 'all' | 'job' | 'internship' | 'club' | 'volunteering' | 'event' | 'competition' | 'scholarship' | 'saved' | string;

interface CustomList {
  id: string;
  name: string;
  createdAt: string;
  opportunityIds: string[];
  opportunities?: EngineOpportunity[];
}

interface AdvancedFilters {
  location?: string;
  remoteOnly?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
  minScore?: number;
}

export default function SuggestionsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [allOpportunities, setAllOpportunities] = useState<EngineOpportunity[]>([]);
  const [starredOpportunitiesData, setStarredOpportunitiesData] = useState<EngineOpportunity[]>([]);
  const [opportunitiesLoading, setOpportunitiesLoading] = useState(false);
  const [starringLoading, setStarringLoading] = useState<string | null>(null);
  const [starredOpportunities, setStarredOpportunities] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({});
  const [customLists, setCustomLists] = useState<CustomList[]>([]);
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [addingToListId, setAddingToListId] = useState<string | null>(null);
  const [isMyListsExpanded, setIsMyListsExpanded] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [openListMenuFor, setOpenListMenuFor] = useState<string | null>(null);
  const [ingesting, setIngesting] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);
  const [listPendingDelete, setListPendingDelete] = useState<string | null>(null);


  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setProfile(snap.data());
      }
    };
    fetchProfile();
  }, [user]);

  // Fetch starred opportunities
  useEffect(() => {
    if (!user) return;
    const fetchStarredOpportunities = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.savedOpportunities) {
            setStarredOpportunities(userData.savedOpportunities);
          }
          // Fetch full opportunity data for starred items
          if (userData.savedOpportunitiesData) {
            setStarredOpportunitiesData(userData.savedOpportunitiesData);
          }
        }
      } catch (error) {
        console.error('Error fetching starred opportunities:', error);
      }
    };
    fetchStarredOpportunities();
  }, [user]);

  // Fetch custom lists
  useEffect(() => {
    if (!user) return;
    const fetchCustomLists = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && userSnap.data().customLists) {
          const lists = userSnap.data().customLists as CustomList[];
          // Populate opportunities for each list
          const listsWithOpportunities = lists.map(list => ({
            ...list,
            opportunities: list.opportunityIds
              .map(id => allOpportunities.find(opp => opp.id === id))
              .filter((opp): opp is EngineOpportunity => opp !== undefined)
          }));
          setCustomLists(listsWithOpportunities);
        }
      } catch (error) {
        console.error('Error fetching custom lists:', error);
      }
    };
    if (user && allOpportunities.length > 0) {
      fetchCustomLists();
    }
  }, [user, allOpportunities]);


  const fetchLastRefreshed = useCallback(async () => {
    try {
      const metaRef = doc(db, 'opportunities_meta', 'last_refresh');
      const snap = await getDoc(metaRef);
      if (snap.exists()) setLastRefreshed(snap.data().refreshedAt ?? null);
    } catch { /* non-fatal */ }
  }, []);

  const fetchOpportunities = useCallback(async () => {
    if (!user) return;

    try {
      setOpportunitiesLoading(true);
      const token = await user.getIdToken();

      // Use available profile data — empty fields mean default/recency-based scoring
      const p = profile || {};
      const userProfileSnapshot = {
        uid: user.uid,
        university: p.university,
        degree: p.degree,
        gpa: p.gpa ? parseFloat(p.gpa) : undefined,
        interests: p.interests,
        preferredIndustries: p.preferredIndustries,
        bio: p.bio,
        goal: p.goal,
        city: p.city,
        country: p.country,
        skills: p.skills || extractSkillsFromProfile(p),
        tags: extractTagsFromProfile(p),
        age: p.age ? parseInt(p.age) : undefined,
        yearOfStudy: p.yearOfStudy,
      };
      
      const response = await fetch('/api/opportunities-engine/match', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userProfile: userProfileSnapshot,
          location: {
            city: p.city,
            country: p.country,
            allowRemote: true
          },
          limit: 500
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAllOpportunities(data.opportunities || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch opportunities:', errorData);
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    } finally {
      setOpportunitiesLoading(false);
    }
  }, [user, profile]);

  const refreshFromSources = useCallback(async () => {
    if (!user || ingesting) return;

    setIngesting(true);
    setRefreshNotice(null);
    setErrorMsg(null);

    try {
      const token = await user.getIdToken();
      const p = profile || {};
      const res = await fetch('/api/opportunities-engine/ingest', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxResults: 200,
          userProfile: {
            uid: user.uid,
            university: p.university,
            degree: p.degree,
            interests: p.interests,
            preferredIndustries: p.preferredIndustries,
            city: p.city,
            country: p.country,
          },
        }),
      });

      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        const wait = data.retryInSeconds ? `${Math.ceil(data.retryInSeconds / 60)} min` : 'a few minutes';
        setRefreshNotice(`You just refreshed — try again in ${wait}.`);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.message || 'Could not pull fresh opportunities. Please try again.');
        return;
      }

      const data = await res.json();
      const stats = data?.stats ?? {};
      setRefreshNotice(`Pulled ${stats.fresh ?? 0} new · ${stats.stored ?? 0} added · ${stats.updated ?? 0} updated`);
      trackEvent('opportunities_refresh_from_sources', user.uid, { stored: stats.stored, updated: stats.updated });

      // Refresh the visible matches against the freshly stored catalog
      await Promise.all([fetchOpportunities(), fetchLastRefreshed()]);
    } catch (err) {
      console.error('Error refreshing from sources:', err);
      setErrorMsg('Could not pull fresh opportunities. Please try again.');
    } finally {
      setIngesting(false);
    }
  }, [user, profile, ingesting, fetchOpportunities, fetchLastRefreshed]);

  // Helper function to extract skills from profile
  const extractSkillsFromProfile = (profile: any): string[] => {
    const skills: string[] = [];
    
    // Extract from interests
    if (profile.interests) {
      const interestWords = profile.interests.toLowerCase().split(/[,\s]+/);
      const techSkills = ['javascript', 'python', 'react', 'node', 'java', 'sql', 'html', 'css', 'typescript', 'angular', 'vue'];
      interestWords.forEach((word: string) => {
        if (techSkills.includes(word) && !skills.includes(word)) {
          skills.push(word);
        }
      });
    }
    
    // Extract from degree
    if (profile.degree) {
      const degreeLower = profile.degree.toLowerCase();
      if (degreeLower.includes('computer') || degreeLower.includes('software') || degreeLower.includes('engineering')) {
        if (!skills.includes('programming')) skills.push('programming');
      }
      if (degreeLower.includes('data') || degreeLower.includes('analytics')) {
        if (!skills.includes('data-analysis')) skills.push('data-analysis');
      }
    }
    
    return skills;
  };

  // Helper function to extract tags from profile
  const extractTagsFromProfile = (profile: any): string[] => {
    const tags: string[] = [];
    
    if (profile.interests) {
      const interestTags = profile.interests.toLowerCase().split(/[,\s]+/).filter((t: string) => t.length > 2);
      tags.push(...interestTags);
    }
    
    if (profile.preferredIndustries) {
      const industryTags = profile.preferredIndustries.toLowerCase().split(/[,\s]+/).filter((t: string) => t.length > 2);
      tags.push(...industryTags);
    }
    
    return tags;
  };

  // Fetch opportunities and last-refresh timestamp on mount
  useEffect(() => {
    if (!user) return;
    fetchOpportunities();
    fetchLastRefreshed();
  }, [user, profile, fetchOpportunities, fetchLastRefreshed]);

  const toggleStarOpportunity = async (opportunityId: string) => {
    if (!user) return;
    
    setStarringLoading(opportunityId);
    try {
      const userRef = doc(db, 'users', user.uid);
      const isStarred = starredOpportunities.includes(opportunityId);
      
      if (isStarred) {
        await updateDoc(userRef, {
          savedOpportunities: arrayRemove(opportunityId)
        });
        setStarredOpportunities(prev => prev.filter(id => id !== opportunityId));
        setStarredOpportunitiesData(prev => prev.filter(opp => opp.id !== opportunityId));
        trackEvent('opportunity_unsave', user.uid, { opportunityId });
      } else {
        const opportunity = allOpportunities.find(opp => opp.id === opportunityId);
        if (opportunity) {
          await updateDoc(userRef, {
            savedOpportunities: arrayUnion(opportunityId),
            savedOpportunitiesData: arrayUnion(opportunity)
          });
          setStarredOpportunities(prev => [...prev, opportunityId]);
          setStarredOpportunitiesData(prev => [...prev, opportunity]);
          trackEvent('opportunity_save', user.uid, { opportunityId, type: opportunity.type, source: opportunity.source });
        }
      }
    } catch (error) {
      console.error('Error toggling star:', error);
      setErrorMsg('Could not save that opportunity. Please try again.');
    } finally {
      setStarringLoading(null);
    }
  };

  // Create a new custom list
  const createCustomList = async () => {
    if (!user || !newListName.trim()) return;
    
    try {
      const newList: CustomList = {
        id: `list_${Date.now()}`,
        name: newListName.trim(),
        createdAt: new Date().toISOString(),
        opportunityIds: [],
        opportunities: []
      };
      
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const existingLists = userSnap.exists() && userSnap.data().customLists 
        ? userSnap.data().customLists as CustomList[]
        : [];
      
      await updateDoc(userRef, {
        customLists: [...existingLists, newList]
      });
      
      setCustomLists(prev => [...prev, newList]);
      setNewListName('');
      setShowCreateListModal(false);
    } catch (error) {
      console.error('Error creating list:', error);
      setErrorMsg('Could not create that list. Please try again.');
    }
  };

  // Add opportunity to a custom list
  const addToCustomList = async (opportunityId: string, listId: string) => {
    if (!user) return;
    
    setAddingToListId(listId);
    try {
      const opportunity = allOpportunities.find(opp => opp.id === opportunityId);
      if (!opportunity) return;
      
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const existingLists = userSnap.exists() && userSnap.data().customLists 
        ? userSnap.data().customLists as CustomList[]
        : [];
      
      const updatedLists = existingLists.map(list => {
        if (list.id === listId && !list.opportunityIds.includes(opportunityId)) {
          return {
            ...list,
            opportunityIds: [...list.opportunityIds, opportunityId]
          };
        }
        return list;
      });
      
      await updateDoc(userRef, {
        customLists: updatedLists
      });
      
      setCustomLists(prev => prev.map(list => {
        if (list.id === listId && !list.opportunityIds.includes(opportunityId)) {
          return {
            ...list,
            opportunityIds: [...list.opportunityIds, opportunityId],
            opportunities: [...(list.opportunities || []), opportunity]
          };
        }
        return list;
      }));
    } catch (error) {
      console.error('Error adding to list:', error);
      setErrorMsg('Could not add to that list. Please try again.');
    } finally {
      setAddingToListId(null);
    }
  };

  // Remove opportunity from a custom list
  const removeFromCustomList = async (opportunityId: string, listId: string) => {
    if (!user) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const existingLists = userSnap.exists() && userSnap.data().customLists 
        ? userSnap.data().customLists as CustomList[]
        : [];
      
      const updatedLists = existingLists.map(list => {
        if (list.id === listId) {
          return {
            ...list,
            opportunityIds: list.opportunityIds.filter(id => id !== opportunityId)
          };
        }
        return list;
      });
      
      await updateDoc(userRef, {
        customLists: updatedLists
      });
      
      setCustomLists(prev => prev.map(list => {
        if (list.id === listId) {
          return {
            ...list,
            opportunityIds: list.opportunityIds.filter(id => id !== opportunityId),
            opportunities: list.opportunities?.filter(opp => opp.id !== opportunityId) || []
          };
        }
        return list;
      }));
    } catch (error) {
      console.error('Error removing from list:', error);
      setErrorMsg('Could not remove that opportunity. Please try again.');
    }
  };

  // Delete a custom list
  const deleteCustomList = async (listId: string) => {
    if (!user) return;
    setListPendingDelete(null);
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      const existingLists = userSnap.exists() && userSnap.data().customLists 
        ? userSnap.data().customLists as CustomList[]
        : [];
      
      const updatedLists = existingLists.filter(list => list.id !== listId);
      
      await updateDoc(userRef, {
        customLists: updatedLists
      });
      
      setCustomLists(prev => prev.filter(list => list.id !== listId));
      if (activeTab === listId) {
        setActiveTab('all');
      }
    } catch (error) {
      console.error('Error deleting list:', error);
      setErrorMsg('Could not delete that list. Please try again.');
    }
  };

  // Get icon for opportunity type
  const getTypeIcon = (type: OpportunityType) => {
    switch (type) {
      case 'job':
        return Briefcase;
      case 'internship':
        return GraduationCap;
      case 'club':
        return Users;
      case 'volunteering':
        return Heart;
      case 'event':
        return Calendar;
      case 'scholarship':
        return Award;
      case 'competition':
        return Trophy;
      default:
        return Zap;
    }
  };

  // Get type label
  const getTypeLabel = (type: OpportunityType): string => {
    switch (type) {
      case 'job':
        return 'Job';
      case 'internship':
        return 'Internship';
      case 'club':
        return 'Club';
      case 'volunteering':
        return 'Volunteering';
      case 'event':
        return 'Event';
      case 'scholarship':
        return 'Scholarship';
      case 'competition':
        return 'Competition';
      default:
        return type;
    }
  };

  // Get type style — returns inline style + token-driven badge classes
  const getTypeStyle = (type: OpportunityType): { className: string; style: React.CSSProperties } => {
    const tokenMap: Record<OpportunityType | 'default', string> = {
      job: '--accent-blue',
      internship: '--accent-purple',
      club: '--success',
      volunteering: '--accent-purple',
      event: '--warning',
      scholarship: '--warning',
      competition: '--danger',
      default: '--accent-blue',
    };
    const token = tokenMap[type] ?? tokenMap.default;
    return {
      className: 'border',
      style: {
        backgroundColor: `color-mix(in srgb, var(${token}) 12%, transparent)`,
        color: `var(${token})`,
        borderColor: `color-mix(in srgb, var(${token}) 28%, transparent)`,
      },
    };
  };

  const getScoreStyle = (score: number): { className: string; style: React.CSSProperties } => {
    const token = score >= 85 ? '--success' : score >= 70 ? '--warning' : '--accent-purple';
    return {
      className: 'border',
      style: {
        backgroundColor: `color-mix(in srgb, var(${token}) 14%, transparent)`,
        color: `var(${token})`,
        borderColor: `color-mix(in srgb, var(${token}) 30%, transparent)`,
      },
    };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <motion.div
      className="min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="page-container">
        <div>
          {/* Header */}
          <motion.div
            className="page-header"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="page-title">
              <span style={{ color: 'var(--accent-blue)' }}>Opportunities</span>
            </h1>
            <p className="page-subtitle">
              Discover matched opportunities and get AI-powered career recommendations
            </p>
          </motion.div>

          {/* Inline error banner */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-4 flex items-start gap-3 rounded-lg border px-4 py-3"
                style={{
                  backgroundColor: 'var(--danger-soft)',
                  borderColor: 'color-mix(in srgb, var(--danger) 30%, transparent)',
                  color: 'var(--danger)',
                }}
                role="alert"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div className="flex-1 text-sm">{errorMsg}</div>
                <button
                  onClick={() => setErrorMsg(null)}
                  className="shrink-0 rounded-md p-1 hover:bg-[var(--danger-soft)] transition-colors"
                  aria-label="Dismiss error"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Opportunities Engine Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between gap-3 mb-5">
                      <div className="flex items-center gap-2 min-w-0">
                        <Zap className="h-5 w-5 shrink-0 text-[var(--accent-blue)]" />
                        <div className="min-w-0">
                          <h2 className="text-base sm:text-lg font-semibold leading-tight truncate">Opportunity Engine</h2>
                          {lastRefreshed && (
                            <p className="text-xs text-[var(--text-subtle)] mt-0.5 truncate">
                              Store refreshed {new Date(lastRefreshed).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={fetchOpportunities}
                          disabled={opportunitiesLoading || ingesting}
                          title="Re-rank stored opportunities against your profile"
                        >
                          {opportunitiesLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
                              <span className="hidden sm:inline">Loading...</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Refresh</span>
                            </>
                          )}
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={refreshFromSources}
                          disabled={ingesting || opportunitiesLoading}
                          title="Pull the latest opportunities from all sources"
                        >
                          {ingesting ? (
                            <>
                              <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
                              <span className="hidden sm:inline">Pulling...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Pull fresh</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {refreshNotice && (
                      <div
                        className="mb-4 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm"
                        style={{
                          backgroundColor: 'var(--accent-blue-soft)',
                          borderColor: 'color-mix(in srgb, var(--accent-blue) 30%, transparent)',
                          color: 'var(--accent-blue)',
                        }}
                      >
                        <Zap className="h-4 w-4 mt-0.5 shrink-0" />
                        <div className="flex-1">{refreshNotice}</div>
                        <button
                          onClick={() => setRefreshNotice(null)}
                          className="shrink-0 rounded-md p-1 hover:opacity-80 transition-opacity"
                          aria-label="Dismiss notice"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Tab Navigation */}
                    <div className="mb-5">
                      <div className="surface-card-subtle rounded-lg p-2">
                        <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:pb-0 scrollbar-hide">
                          {[
                            { id: 'all' as TabType, label: 'All', icon: Zap },
                            { id: 'job' as TabType, label: 'Jobs', icon: Briefcase },
                            { id: 'internship' as TabType, label: 'Internships', icon: GraduationCap },
                            { id: 'club' as TabType, label: 'Clubs', icon: Users },
                            { id: 'volunteering' as TabType, label: 'Volunteering', icon: Heart },
                            { id: 'event' as TabType, label: 'Events', icon: Calendar },
                            { id: 'competition' as TabType, label: 'Competitions', icon: Trophy },
                            { id: 'scholarship' as TabType, label: 'Scholarships', icon: Award },
                            { id: 'saved' as TabType, label: 'Saved', icon: Star }
                          ].map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                              <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0 ${
                                  isActive
                                    ? 'bg-[var(--accent-blue)] text-white shadow-sm'
                                    : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-elevated)]'
                                }`}
                              >
                                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : ''}`} />
                                {tab.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Custom Lists — moved out of horizontal-scroll row for mobile */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <button
                          onClick={() => setIsMyListsExpanded(!isMyListsExpanded)}
                          className="flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
                        >
                          {isMyListsExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronUp className="h-3 w-3" />
                          )}
                          <span>My Lists{customLists.length > 0 ? ` (${customLists.length})` : ''}</span>
                        </button>
                        <button
                          onClick={() => setShowCreateListModal(true)}
                          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[var(--accent-blue)] hover:bg-[var(--accent-blue-soft)] transition-all duration-200 border border-[var(--accent-blue)]/30 border-dashed rounded"
                        >
                          <Plus className="h-3 w-3" />
                          New List
                        </button>
                      </div>
                      <AnimatePresence>
                        {isMyListsExpanded && customLists.length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="flex flex-wrap gap-2">
                              {customLists.map((list) => {
                                const isActive = activeTab === list.id;
                                return (
                                  <div
                                    key={list.id}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                      isActive
                                        ? 'bg-[var(--accent-blue)] text-white shadow-sm'
                                        : 'bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:text-[var(--foreground)] border border-[var(--border)]'
                                    }`}
                                  >
                                    <button
                                      onClick={() => setActiveTab(list.id)}
                                      className="flex items-center gap-2 flex-1 min-w-0"
                                    >
                                      <FolderPlus className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-[var(--text-muted)]'}`} />
                                      <span className="font-semibold truncate max-w-[10rem]">{list.name}</span>
                                      <span className="text-xs opacity-70 bg-white/20 px-2 py-0.5 rounded-full shrink-0">
                                        {list.opportunityIds.length}
                                      </span>
                                    </button>
                                    {isActive && (
                                      listPendingDelete === list.id ? (
                                        <div className="flex items-center gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
                                          <button
                                            type="button"
                                            onClick={() => deleteCustomList(list.id)}
                                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--danger)] text-white hover:opacity-90 transition-opacity"
                                          >
                                            Delete
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setListPendingDelete(null)}
                                            className="text-[10px] font-medium px-1.5 py-0.5 rounded hover:bg-white/20 transition-colors"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setListPendingDelete(list.id);
                                          }}
                                          className="ml-1 p-1 rounded transition-colors cursor-pointer hover:bg-white/20"
                                          aria-label="Delete list"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      )
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Search Bar and Advanced Filters */}
                    {activeTab !== 'saved' && !customLists.some(list => list.id === activeTab) && (
                      <div className="mb-6 space-y-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[var(--text-muted)]" />
                          <input
                            type="text"
                            placeholder="Search opportunities..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)] focus:ring-2 focus:ring-[var(--accent-blue)]/20"
                          />
                        </div>
                        
                        {/* Advanced Filters Toggle */}
                        <button
                          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                          className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
                        >
                          <Filter className="h-4 w-4" />
                          Advanced Filters
                          {showAdvancedFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                        
                        {/* Advanced Filters Panel */}
                        <AnimatePresence>
                          {showAdvancedFilters && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <Card>
                                <CardContent className="p-4">
                                  <div className="grid md:grid-cols-2 gap-4">
                                    {/* Location Filter */}
                                    <div>
                                      <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Location</label>
                                      <input
                                        type="text"
                                        placeholder="City or country"
                                        value={advancedFilters.location || ''}
                                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, location: e.target.value || undefined }))}
                                        className="w-full px-3 py-2 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)]"
                                      />
                                    </div>

                                    {/* Remote Only */}
                                    <div className="flex items-center pt-8">
                                      <input
                                        type="checkbox"
                                        id="remoteOnly"
                                        checked={advancedFilters.remoteOnly || false}
                                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, remoteOnly: e.target.checked || undefined }))}
                                        className="w-4 h-4 rounded border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--accent-blue)] focus:ring-[var(--accent-blue)]"
                                      />
                                      <label htmlFor="remoteOnly" className="ml-2 text-sm text-[var(--text-secondary)]">Remote only</label>
                                    </div>

                                    {/* Salary Range */}
                                    <div>
                                      <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Min Salary (NZD)</label>
                                      <input
                                        type="number"
                                        placeholder="e.g., 50000"
                                        value={advancedFilters.salaryMin || ''}
                                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, salaryMin: e.target.value ? parseInt(e.target.value) : undefined }))}
                                        className="w-full px-3 py-2 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)]"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Max Salary (NZD)</label>
                                      <input
                                        type="number"
                                        placeholder="e.g., 100000"
                                        value={advancedFilters.salaryMax || ''}
                                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, salaryMax: e.target.value ? parseInt(e.target.value) : undefined }))}
                                        className="w-full px-3 py-2 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)]"
                                      />
                                    </div>

                                    {/* Date Range */}
                                    <div>
                                      <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">From Date</label>
                                      <input
                                        type="date"
                                        value={advancedFilters.dateFrom || ''}
                                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, dateFrom: e.target.value || undefined }))}
                                        className="w-full px-3 py-2 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-blue)]"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">To Date</label>
                                      <input
                                        type="date"
                                        value={advancedFilters.dateTo || ''}
                                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, dateTo: e.target.value || undefined }))}
                                        className="w-full px-3 py-2 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-blue)]"
                                      />
                                    </div>

                                    {/* Min Score */}
                                    <div>
                                      <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Min Match Score</label>
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        placeholder="e.g., 70"
                                        value={advancedFilters.minScore || ''}
                                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, minScore: e.target.value ? parseInt(e.target.value) : undefined }))}
                                        className="w-full px-3 py-2 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)]"
                                      />
                                    </div>
                                  </div>

                                  {/* Clear Filters Button */}
                                  <div className="mt-4 flex justify-end">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setAdvancedFilters({})}
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      Clear Filters
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {(() => {
                      // Filter opportunities based on active tab and search
                      let filteredOpportunities: EngineOpportunity[] = [];
                      
                      // Check if activeTab is a custom list
                      const activeCustomList = customLists.find(list => list.id === activeTab);
                      
                      if (activeTab === 'saved') {
                        filteredOpportunities = starredOpportunitiesData;
                      } else if (activeCustomList) {
                        filteredOpportunities = activeCustomList.opportunities || [];
                      } else if (activeTab === 'all') {
                        filteredOpportunities = allOpportunities;
                      } else {
                        filteredOpportunities = allOpportunities.filter(opp => opp.type === activeTab);
                      }
                      
                      // Apply search filter
                      if (searchQuery.trim()) {
                        const query = searchQuery.toLowerCase();
                        filteredOpportunities = filteredOpportunities.filter(opp =>
                          opp.title?.toLowerCase().includes(query) ||
                          opp.description?.toLowerCase().includes(query) ||
                          opp.organization?.toLowerCase().includes(query) ||
                          opp.tags?.some(tag => tag.toLowerCase().includes(query)) ||
                          opp.category?.toLowerCase().includes(query)
                        );
                      }
                      
                      // Apply advanced filters
                      if (advancedFilters.location) {
                        const locationLower = advancedFilters.location.toLowerCase();
                        filteredOpportunities = filteredOpportunities.filter(opp =>
                          opp.location.toLowerCase().includes(locationLower) ||
                          opp.city?.toLowerCase().includes(locationLower) ||
                          opp.country?.toLowerCase().includes(locationLower)
                        );
                      }
                      
                      if (advancedFilters.remoteOnly) {
                        filteredOpportunities = filteredOpportunities.filter(opp => opp.isRemote === true);
                      }
                      
                      if (advancedFilters.salaryMin !== undefined) {
                        filteredOpportunities = filteredOpportunities.filter(opp =>
                          opp.salaryMin && opp.salaryMin >= advancedFilters.salaryMin!
                        );
                      }
                      
                      if (advancedFilters.salaryMax !== undefined) {
                        filteredOpportunities = filteredOpportunities.filter(opp =>
                          opp.salaryMax && opp.salaryMax <= advancedFilters.salaryMax!
                        );
                      }
                      
                      if (advancedFilters.dateFrom) {
                        const fromDate = new Date(advancedFilters.dateFrom);
                        filteredOpportunities = filteredOpportunities.filter(opp =>
                          new Date(opp.createdAt) >= fromDate
                        );
                      }
                      
                      if (advancedFilters.dateTo) {
                        const toDate = new Date(advancedFilters.dateTo);
                        filteredOpportunities = filteredOpportunities.filter(opp =>
                          new Date(opp.createdAt) <= toDate
                        );
                      }
                      
                      if (advancedFilters.minScore !== undefined) {
                        filteredOpportunities = filteredOpportunities.filter(opp =>
                          opp.score !== undefined && opp.score >= advancedFilters.minScore!
                        );
                      }
                      
                      return opportunitiesLoading ? (
                        <div className="text-center py-12">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-blue)] mx-auto mb-4"></div>
                          <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">Finding Opportunities</h3>
                          <p className="text-[var(--text-muted)]">Matching opportunities to your profile...</p>
                        </div>
                      ) : filteredOpportunities.length > 0 ? (
                        <div>
                          <div className="mb-4 text-[var(--text-muted)] text-sm">
                            Showing {filteredOpportunities.length} {activeTab === 'saved' ? 'saved' : activeTab === 'all' ? '' : getTypeLabel(activeTab as OpportunityType).toLowerCase()} {filteredOpportunities.length === 1 ? 'opportunity' : 'opportunities'}
                            {searchQuery && ` matching "${searchQuery}"`}
                          </div>
                          <div className="grid gap-4 sm:gap-6">
                            {filteredOpportunities.map((opportunity) => {
                          const isStarred = starredOpportunities.includes(opportunity.id);
                          const TypeIcon = getTypeIcon(opportunity.type);
                          return (
                            <div
                              key={opportunity.id}
                              className="surface-card rounded-xl p-4 sm:p-6 hover:shadow-[var(--shadow-md)] transition-all duration-200"
                            >
                              <div className="flex items-start justify-between mb-4 gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <TypeIcon className="h-4 w-4 text-[var(--accent-blue)] shrink-0" />
                                    {(() => {
                                      const t = getTypeStyle(opportunity.type);
                                      return (
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${t.className}`} style={t.style}>
                                          {getTypeLabel(opportunity.type)}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                  <h3 className="text-[var(--foreground)] font-semibold text-base sm:text-lg mb-1 line-clamp-2">
                                    {opportunity.title}
                                  </h3>
                                  <p className="text-[var(--text-secondary)] text-sm sm:text-base mb-3 truncate">{opportunity.organization}</p>
                                </div>
                                <div className="flex items-start flex-col sm:flex-row sm:items-center gap-2 shrink-0 ml-2">
                                  {opportunity.score !== undefined && (() => {
                                    const s = getScoreStyle(opportunity.score);
                                    return (
                                      <div
                                        className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${s.className}`}
                                        style={s.style}
                                      >
                                        {opportunity.score}%
                                      </div>
                                    );
                                  })()}
                                  <div className="flex items-center gap-1 sm:gap-2">
                                    {/* Add to List Dropdown — click-toggle for mobile */}
                                    <div className="relative">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOpenListMenuFor((cur) => (cur === opportunity.id ? null : opportunity.id));
                                        }}
                                        className="p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--accent-blue)] hover:bg-[var(--accent-blue-soft)] transition-all duration-200"
                                        aria-label="Add to list"
                                        aria-expanded={openListMenuFor === opportunity.id}
                                      >
                                        <FolderPlus className="h-5 w-5" />
                                      </button>
                                      {openListMenuFor === opportunity.id && (
                                        <>
                                          <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setOpenListMenuFor(null)}
                                            aria-hidden
                                          />
                                          <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] bg-[var(--surface)] rounded-lg shadow-[var(--shadow-lg)] border border-[var(--border)] z-50">
                                            <div className="py-2 max-h-72 overflow-y-auto">
                                              {customLists.length === 0 ? (
                                                <button
                                                  onClick={() => {
                                                    setOpenListMenuFor(null);
                                                    setShowCreateListModal(true);
                                                  }}
                                                  className="w-full text-left px-4 py-2 text-sm text-[var(--accent-blue)] hover:bg-[var(--accent-blue-soft)] transition-colors"
                                                >
                                                  <Plus className="h-4 w-4 inline mr-2" />
                                                  Create a list first
                                                </button>
                                              ) : (
                                                <>
                                                  {customLists.map((list) => {
                                                    const isInList = list.opportunityIds.includes(opportunity.id);
                                                    return (
                                                      <button
                                                        key={list.id}
                                                        onClick={() => {
                                                          if (isInList) {
                                                            removeFromCustomList(opportunity.id, list.id);
                                                          } else {
                                                            addToCustomList(opportunity.id, list.id);
                                                          }
                                                          setOpenListMenuFor(null);
                                                        }}
                                                        disabled={addingToListId === list.id}
                                                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                                          isInList
                                                            ? 'text-[var(--accent-blue)] bg-[var(--accent-blue-soft)]'
                                                            : 'text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]'
                                                        }`}
                                                      >
                                                        {addingToListId === list.id ? (
                                                          <div className="flex items-center">
                                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                            Adding...
                                                          </div>
                                                        ) : (
                                                          <div className="flex items-center justify-between gap-2">
                                                            <span className="truncate">{isInList ? '✓ ' : ''}{list.name}</span>
                                                          </div>
                                                        )}
                                                      </button>
                                                    );
                                                  })}
                                                  <div className="border-t border-[var(--border)] my-1"></div>
                                                  <button
                                                    onClick={() => {
                                                      setOpenListMenuFor(null);
                                                      setShowCreateListModal(true);
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm text-[var(--accent-blue)] hover:bg-[var(--accent-blue-soft)] transition-colors"
                                                  >
                                                    <Plus className="h-4 w-4 inline mr-2" />
                                                    Create new list
                                                  </button>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        </>
                                      )}
                                    </div>

                                    {/* Star Button */}
                                    <button
                                      onClick={() => toggleStarOpportunity(opportunity.id)}
                                      disabled={starringLoading === opportunity.id}
                                      aria-label={isStarred ? 'Unsave opportunity' : 'Save opportunity'}
                                      className={`p-2 rounded-full transition-all duration-200 ${
                                        isStarred
                                          ? 'bg-[var(--warning-soft)] hover:opacity-80'
                                          : 'text-[var(--text-muted)] hover:bg-[var(--warning-soft)]'
                                      }`}
                                      style={isStarred ? { color: 'var(--warning)' } : undefined}
                                    >
                                      {starringLoading === opportunity.id ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                                      ) : (
                                        <Star className={`h-5 w-5 ${isStarred ? 'fill-current' : ''}`} />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center text-[var(--text-muted)] text-xs sm:text-sm mb-4 gap-3 sm:gap-5 flex-wrap">
                                <div className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-2" />
                                  {opportunity.isRemote ? 'Remote' : opportunity.location}
                                </div>
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-2" />
                                  {formatDate(opportunity.createdAt)}
                                </div>
                                {opportunity.deadline && (
                                  <div className="flex items-center text-[var(--warning)]">
                                    <Target className="h-4 w-4 mr-2" />
                                    Deadline: {new Date(opportunity.deadline).toLocaleDateString()}
                                  </div>
                                )}
                                {opportunity.salaryMin && opportunity.salaryMax && (
                                  <div className="flex items-center text-[var(--success)]">
                                    <TrendingUp className="h-4 w-4 mr-2" />
                                    {opportunity.currency || 'NZD'} {opportunity.salaryMin.toLocaleString()} - {opportunity.salaryMax.toLocaleString()}
                                  </div>
                                )}
                              </div>

                              {opportunity.matchReasons && opportunity.matchReasons.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {opportunity.matchReasons.slice(0, 3).map((reason, idx) => (
                                    <span key={idx} className="text-xs bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] px-2 py-1 rounded-full border border-[var(--accent-blue)]/20">
                                      {reason}
                                    </span>
                                  ))}
                                </div>
                              )}

                              <p className="text-[var(--text-secondary)] text-base mb-4 line-clamp-3 leading-relaxed">
                                {opportunity.description}
                              </p>

                              {opportunity.tags && opportunity.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {opportunity.tags.slice(0, 5).map((tag, idx) => (
                                    <span key={idx} className="text-xs bg-[var(--surface-elevated)] text-[var(--text-muted)] px-2 py-1 rounded">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}

                              <div className="flex items-center justify-between flex-wrap gap-2">
                                {opportunity.category && (
                                  <span className="text-xs sm:text-sm text-[var(--text-muted)] capitalize bg-[var(--surface-elevated)] px-3 py-1 rounded-full">
                                    {opportunity.category}
                                  </span>
                                )}
                                <div className="flex items-center gap-2 ml-auto">
                                  <a
                                    href={opportunity.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => user && trackEvent('opportunity_apply', user.uid, { opportunityId: opportunity.id, type: opportunity.type, source: opportunity.source })}
                                    className="inline-flex items-center bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-strong)] text-white font-medium px-4 py-2 rounded-lg transition-all duration-200"
                                  >
                                    {opportunity.type === 'scholarship' ? 'Learn More' : opportunity.type === 'event' ? 'Register' : opportunity.type === 'competition' ? 'Enter' : opportunity.type === 'club' ? 'Join' : opportunity.type === 'volunteering' ? 'Sign Up' : 'Apply Now'}
                                    <ExternalLink className="h-4 w-4 ml-2" />
                                  </a>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                      ) : (
                        <div className="text-center py-16">
                          {activeTab === 'saved' ? (
                            <>
                              <Star className="h-16 w-16 text-[var(--text-muted)] mx-auto mb-6" />
                              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-3">No Saved Opportunities</h3>
                              <p className="text-[var(--text-muted)] mb-6 max-w-md mx-auto">You haven&apos;t saved any opportunities yet. Star opportunities you&apos;re interested in to save them here.</p>
                              <Button
                                variant="outline"
                                onClick={() => setActiveTab('all')}
                              >
                                Browse Opportunities
                              </Button>
                            </>
                          ) : customLists.some(list => list.id === activeTab) ? (
                            <>
                              <FolderPlus className="h-16 w-16 text-[var(--text-muted)] mx-auto mb-6" />
                              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-3">List is Empty</h3>
                              <p className="text-[var(--text-muted)] mb-6 max-w-md mx-auto">This list doesn&apos;t have any opportunities yet. Use the folder icon on opportunities to add them to this list.</p>
                              <Button
                                variant="outline"
                                onClick={() => setActiveTab('all')}
                              >
                                Browse Opportunities
                              </Button>
                            </>
                          ) : (
                            <>
                              <Zap className="h-16 w-16 text-[var(--text-muted)] mx-auto mb-6" />
                              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-3">No Opportunities Found</h3>
                              <p className="text-[var(--text-muted)] mb-6 max-w-md mx-auto">
                                {searchQuery
                                  ? `No ${activeTab === 'all' ? '' : getTypeLabel(activeTab as OpportunityType).toLowerCase()} opportunities match "${searchQuery}". Try a different search term.`
                                  : `We couldn't find any ${activeTab === 'all' ? '' : getTypeLabel(activeTab as OpportunityType).toLowerCase()} opportunities that match your profile. Try updating your profile or check back later.`
                                }
                              </p>
                              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                {searchQuery && (
                                  <Button
                                    variant="outline"
                                    onClick={() => setSearchQuery('')}
                                  >
                                    Clear Search
                                  </Button>
                                )}
                                <Link href="/profile">
                                  <Button>
                                    Update Profile
                                  </Button>
                                </Link>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
          </motion.div>
        </div>
      </div>
      
      {/* Create List Modal */}
      <AnimatePresence>
        {showCreateListModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateListModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6 max-w-md w-full shadow-[var(--shadow-lg)]"
            >
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4">Create New List</h3>
              <input
                type="text"
                placeholder="List name (e.g., 'Summer 2025 Applications')"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    createCustomList();
                  }
                }}
                className="w-full px-4 py-3 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)] mb-4"
                autoFocus
              />
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateListModal(false);
                    setNewListName('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={createCustomList}
                  disabled={!newListName.trim()}
                >
                  Create List
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

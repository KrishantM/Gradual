'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, addDoc, deleteDoc, setDoc } from 'firebase/firestore';
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
  Edit2,
  Trophy
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


  const triggerIngestion = useCallback(async () => {
    if (!user) return;
    const THROTTLE_KEY = 'gradual_last_ingest';
    const THROTTLE_MS = 6 * 60 * 60 * 1000; // 6 hours
    const lastRun = localStorage.getItem(THROTTLE_KEY);
    if (lastRun && Date.now() - parseInt(lastRun, 10) < THROTTLE_MS) return;

    try {
      localStorage.setItem(THROTTLE_KEY, String(Date.now()));
      const token = await user.getIdToken();
      fetch('/api/opportunities-engine/ingest', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxResults: 200 }),
      }).catch(() => {});
    } catch (err) {
      console.error('Ingestion trigger failed (non-blocking):', err);
    }
  }, [user]);

  const fetchOpportunities = useCallback(async () => {
    if (!user || !profile) return;
    
    try {
      setOpportunitiesLoading(true);
      const token = await user.getIdToken();
      
      // Map profile to UserProfileSnapshot format
      const userProfileSnapshot = {
        uid: user.uid,
        university: profile.university,
        degree: profile.degree,
        gpa: profile.gpa ? parseFloat(profile.gpa) : undefined,
        interests: profile.interests,
        preferredIndustries: profile.preferredIndustries,
        bio: profile.bio,
        goal: profile.goal,
        city: profile.city,
        country: profile.country,
        skills: profile.skills || extractSkillsFromProfile(profile),
        tags: extractTagsFromProfile(profile),
        age: profile.age ? parseInt(profile.age) : undefined,
        yearOfStudy: profile.yearOfStudy
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
            city: profile.city,
            country: profile.country,
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

  useEffect(() => {
    if (profile) {
      triggerIngestion();
      fetchOpportunities();
    }
  }, [profile, fetchOpportunities, triggerIngestion]);

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
      alert('Failed to save opportunity');
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
      alert('Failed to create list');
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
      alert('Failed to add to list');
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
      alert('Failed to remove from list');
    }
  };

  // Delete a custom list
  const deleteCustomList = async (listId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this list? This action cannot be undone.')) return;
    
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
      alert('Failed to delete list');
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

  // Get type color
  const getTypeColor = (type: OpportunityType): string => {
    switch (type) {
      case 'job':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'internship':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'club':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'volunteering':
        return 'bg-pink-500/10 text-pink-600 border-pink-500/20';
      case 'event':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'scholarship':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'competition':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };


  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-orange-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-500/10 border-emerald-500/20';
    if (score >= 70) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-orange-500/10 border-orange-500/20';
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
              <span className="text-[var(--accent-blue)]">Opportunities Engine</span>
            </h1>
            <p className="page-subtitle">
              Discover matched opportunities and get AI-powered career recommendations
            </p>
          </motion.div>

          {/* Opportunities Engine Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
                <Card>
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-[var(--accent-blue)]" />
                        <h2 className="text-lg font-semibold">Opportunity Engine</h2>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchOpportunities}
                        disabled={opportunitiesLoading}
                      >
                        {opportunitiesLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Tab Navigation */}
                    <div className="mb-6">
                      <div className="surface-card-subtle rounded-lg p-2">
                        <div className="flex flex-wrap gap-2">
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
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
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
                          
                          {/* Custom Lists Section */}
                          {customLists.length > 0 && (
                            <>
                              <div className="w-full border-t border-[var(--border)] my-2 pt-2">
                                <div className="flex items-center justify-between px-2 mb-2">
                                  <button
                                    onClick={() => setIsMyListsExpanded(!isMyListsExpanded)}
                                    className="flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
                                  >
                                    {isMyListsExpanded ? (
                                      <ChevronDown className="h-3 w-3" />
                                    ) : (
                                      <ChevronUp className="h-3 w-3" />
                                    )}
                                    <span>My Lists ({customLists.length})</span>
                                  </button>
                                  <button
                                    onClick={() => setShowCreateListModal(true)}
                                    className={`flex items-center gap-2 font-medium text-[var(--accent-blue)] hover:bg-[var(--accent-blue-soft)] transition-all duration-200 border border-[var(--accent-blue)]/30 border-dashed rounded ${
                                      isMyListsExpanded
                                        ? 'px-3 py-1.5 text-sm'
                                        : 'px-2 py-1 text-xs'
                                    }`}
                                  >
                                    <Plus className={isMyListsExpanded ? 'h-4 w-4' : 'h-3 w-3'} />
                                    New List
                                  </button>
                                </div>
                              </div>
                              <AnimatePresence>
                                {isMyListsExpanded && (
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
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                              isActive
                                                ? 'bg-[var(--accent-blue)] text-white shadow-sm'
                                                : 'bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:text-[var(--foreground)] border border-[var(--border)]'
                                            }`}
                                          >
                                            <button
                                              onClick={() => setActiveTab(list.id)}
                                              className="flex items-center gap-2 flex-1"
                                            >
                                              <FolderPlus className={`h-4 w-4 ${isActive ? 'text-white' : 'text-[var(--text-muted)]'}`} />
                                              <span className="font-semibold">{list.name}</span>
                                              <span className="text-xs opacity-70 bg-white/20 px-2 py-0.5 rounded-full">
                                                {list.opportunityIds.length}
                                              </span>
                                            </button>
                                            {isActive && (
                                              <div
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  deleteCustomList(list.id);
                                                }}
                                                className="ml-1 p-1 rounded hover:bg-red-500/30 transition-colors cursor-pointer"
                                                title="Delete list"
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </>
                          )}
                          
                          {/* Create New List Button (when no lists exist) */}
                          {customLists.length === 0 && (
                            <button
                              onClick={() => setShowCreateListModal(true)}
                              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-[var(--accent-blue)] hover:bg-[var(--accent-blue-soft)] transition-all duration-200 border border-[var(--accent-blue)]/30 border-dashed"
                            >
                              <Plus className="h-4 w-4" />
                              New List
                            </button>
                          )}
                        </div>
                      </div>
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
                          opp.title.toLowerCase().includes(query) ||
                          opp.description.toLowerCase().includes(query) ||
                          opp.organization.toLowerCase().includes(query) ||
                          opp.tags.some(tag => tag.toLowerCase().includes(query)) ||
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
                          <div className="grid gap-6">
                            {filteredOpportunities.map((opportunity) => {
                          const isStarred = starredOpportunities.includes(opportunity.id);
                          const TypeIcon = getTypeIcon(opportunity.type);
                          return (
                            <div
                              key={opportunity.id}
                              className="surface-card rounded-xl p-6 hover:shadow-[var(--shadow-md)] transition-all duration-200"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <TypeIcon className="h-5 w-5 text-[var(--accent-blue)]" />
                                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getTypeColor(opportunity.type)}`}>
                                      {getTypeLabel(opportunity.type)}
                                    </span>
                                  </div>
                                  <h3 className="text-[var(--foreground)] font-semibold text-lg mb-2 line-clamp-2">
                                    {opportunity.title}
                                  </h3>
                                  <p className="text-[var(--text-secondary)] text-base mb-3">{opportunity.organization}</p>
                                </div>
                                <div className="flex items-center space-x-3 ml-4">
                                  {opportunity.score !== undefined && (
                                    <div className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${getScoreBgColor(opportunity.score)} ${getScoreColor(opportunity.score)}`}>
                                      {opportunity.score}% Match
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    {/* Add to List Dropdown */}
                                    <div className="relative group">
                                      <button
                                        className="p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--accent-blue)] hover:bg-[var(--accent-blue-soft)] transition-all duration-200"
                                        title="Add to list"
                                      >
                                        <FolderPlus className="h-5 w-5" />
                                      </button>
                                      <div className="absolute right-0 mt-2 w-48 bg-[var(--surface)] rounded-lg shadow-[var(--shadow-lg)] border border-[var(--border)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                        <div className="py-2">
                                          {customLists.length === 0 ? (
                                            <button
                                              onClick={() => setShowCreateListModal(true)}
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
                                                      <div className="flex items-center justify-between">
                                                        <span>{isInList ? '✓' : ''} {list.name}</span>
                                                      </div>
                                                    )}
                                                  </button>
                                                );
                                              })}
                                              <div className="border-t border-[var(--border)] my-1"></div>
                                              <button
                                                onClick={() => setShowCreateListModal(true)}
                                                className="w-full text-left px-4 py-2 text-sm text-[var(--accent-blue)] hover:bg-[var(--accent-blue-soft)] transition-colors"
                                              >
                                                <Plus className="h-4 w-4 inline mr-2" />
                                                Create new list
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Star Button */}
                                    <button
                                      onClick={() => toggleStarOpportunity(opportunity.id)}
                                      disabled={starringLoading === opportunity.id}
                                      className={`p-2 rounded-full transition-all duration-200 ${
                                        isStarred
                                          ? 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20'
                                          : 'text-[var(--text-muted)] hover:text-amber-500 hover:bg-amber-500/10'
                                      }`}
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
                              
                              <div className="flex items-center text-[var(--text-muted)] text-sm mb-4 space-x-6 flex-wrap">
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

                              <div className="flex items-center justify-between">
                                {opportunity.category && (
                                  <span className="text-sm text-[var(--text-muted)] capitalize bg-[var(--surface-elevated)] px-3 py-1 rounded-full">
                                    {opportunity.category}
                                  </span>
                                )}
                                <div className="flex items-center space-x-3 ml-auto">
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

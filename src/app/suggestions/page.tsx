'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, addDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
  Edit2
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

type TabType = 'all' | 'job' | 'internship' | 'club' | 'volunteering' | 'event' | 'scholarship' | 'saved' | string;

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


  // Fetch opportunities from the Opportunities Engine
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
          limit: 100 // Fetch more to allow filtering
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

  // Fetch opportunities when profile loads
  useEffect(() => {
    if (profile) {
      fetchOpportunities();
    }
  }, [profile, fetchOpportunities]);

  const toggleStarOpportunity = async (opportunityId: string) => {
    if (!user) return;
    
    setStarringLoading(opportunityId);
    try {
      const userRef = doc(db, 'users', user.uid);
      const isStarred = starredOpportunities.includes(opportunityId);
      
      if (isStarred) {
        // Remove from starred
        await updateDoc(userRef, {
          savedOpportunities: arrayRemove(opportunityId)
        });
        setStarredOpportunities(prev => prev.filter(id => id !== opportunityId));
        setStarredOpportunitiesData(prev => prev.filter(opp => opp.id !== opportunityId));
      } else {
        // Add to starred - store both ID and full opportunity data
        const opportunity = allOpportunities.find(opp => opp.id === opportunityId);
        if (opportunity) {
          await updateDoc(userRef, {
            savedOpportunities: arrayUnion(opportunityId),
            savedOpportunitiesData: arrayUnion(opportunity)
          });
          setStarredOpportunities(prev => [...prev, opportunityId]);
          setStarredOpportunitiesData(prev => [...prev, opportunity]);
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
      default:
        return type;
    }
  };

  // Get type color
  const getTypeColor = (type: OpportunityType): string => {
    switch (type) {
      case 'job':
        return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
      case 'internship':
        return 'bg-purple-500/20 text-purple-300 border-purple-400/30';
      case 'club':
        return 'bg-green-500/20 text-green-300 border-green-400/30';
      case 'volunteering':
        return 'bg-pink-500/20 text-pink-300 border-pink-400/30';
      case 'event':
        return 'bg-orange-500/20 text-orange-300 border-orange-400/30';
      case 'scholarship':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
    }
  };


  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 85) return 'bg-green-500/20 border-green-400/30';
    if (score >= 70) return 'bg-yellow-500/20 border-yellow-400/30';
    return 'bg-orange-500/20 border-orange-400/30';
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
                <motion.span 
                  className="text-blue-400"
                  animate={{ 
                    textShadow: [
                      "0 0 0px rgba(59, 130, 246, 0)",
                      "0 0 20px rgba(59, 130, 246, 0.5)",
                      "0 0 0px rgba(59, 130, 246, 0)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Opportunities Engine
                </motion.span>
              </motion.h1>
              <motion.p 
                className="text-gray-300 text-lg max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                Discover matched opportunities (jobs, internships, clubs, events, scholarships) and get AI-powered career recommendations
              </motion.p>
            </div>
          </motion.div>

          {/* Opportunities Engine Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
                <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <Zap className="h-6 w-6 text-blue-400 mr-3" />
                        <h2 className="text-2xl font-semibold text-white">Opportunity Engine</h2>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchOpportunities}
                        disabled={opportunitiesLoading}
                        className="bg-blue-600/20 border-blue-400/30 text-blue-300 hover:bg-blue-600/30 hover:border-blue-400/50"
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
                      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-2">
                        <div className="flex flex-wrap gap-2">
                          {[
                            { id: 'all' as TabType, label: 'All', icon: Zap },
                            { id: 'job' as TabType, label: 'Jobs', icon: Briefcase },
                            { id: 'internship' as TabType, label: 'Internships', icon: GraduationCap },
                            { id: 'club' as TabType, label: 'Clubs', icon: Users },
                            { id: 'volunteering' as TabType, label: 'Volunteering', icon: Heart },
                            { id: 'event' as TabType, label: 'Events', icon: Calendar },
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
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'text-gray-300 hover:text-white hover:bg-white/10'
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
                              <div className="w-full border-t border-white/20 my-2 pt-2">
                                <div className="flex items-center justify-between px-2 mb-2">
                                  <button
                                    onClick={() => setIsMyListsExpanded(!isMyListsExpanded)}
                                    className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-300 transition-colors"
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
                                    className={`flex items-center gap-2 font-medium text-purple-300 hover:text-purple-200 hover:bg-purple-500/20 transition-all duration-200 border border-purple-400/40 border-dashed rounded ${
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
                                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg border-2 border-purple-400'
                                                : 'bg-purple-500/20 text-purple-300 hover:text-purple-200 hover:bg-purple-500/30 border border-purple-400/30'
                                            }`}
                                          >
                                            <button
                                              onClick={() => setActiveTab(list.id)}
                                              className="flex items-center gap-2 flex-1"
                                            >
                                              <FolderPlus className={`h-4 w-4 ${isActive ? 'text-white' : 'text-purple-300'}`} />
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
                              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-purple-300 hover:text-purple-200 hover:bg-purple-500/20 transition-all duration-200 border border-purple-400/40 border-dashed"
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
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search opportunities..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                          />
                        </div>
                        
                        {/* Advanced Filters Toggle */}
                        <button
                          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                          className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
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
                              <Card className="bg-white/5 backdrop-blur-md border-white/10">
                                <CardContent className="p-4">
                                  <div className="grid md:grid-cols-2 gap-4">
                                    {/* Location Filter */}
                                    <div>
                                      <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                                      <input
                                        type="text"
                                        placeholder="City or country"
                                        value={advancedFilters.location || ''}
                                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, location: e.target.value || undefined }))}
                                        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:border-blue-400"
                                      />
                                    </div>
                                    
                                    {/* Remote Only */}
                                    <div className="flex items-center pt-8">
                                      <input
                                        type="checkbox"
                                        id="remoteOnly"
                                        checked={advancedFilters.remoteOnly || false}
                                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, remoteOnly: e.target.checked || undefined }))}
                                        className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
                                      />
                                      <label htmlFor="remoteOnly" className="ml-2 text-sm text-gray-300">Remote only</label>
                                    </div>
                                    
                                    {/* Salary Range */}
                                    <div>
                                      <label className="block text-sm font-medium text-gray-300 mb-2">Min Salary (NZD)</label>
                                      <input
                                        type="number"
                                        placeholder="e.g., 50000"
                                        value={advancedFilters.salaryMin || ''}
                                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, salaryMin: e.target.value ? parseInt(e.target.value) : undefined }))}
                                        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:border-blue-400"
                                      />
                                    </div>
                                    
                                    <div>
                                      <label className="block text-sm font-medium text-gray-300 mb-2">Max Salary (NZD)</label>
                                      <input
                                        type="number"
                                        placeholder="e.g., 100000"
                                        value={advancedFilters.salaryMax || ''}
                                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, salaryMax: e.target.value ? parseInt(e.target.value) : undefined }))}
                                        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:border-blue-400"
                                      />
                                    </div>
                                    
                                    {/* Date Range */}
                                    <div>
                                      <label className="block text-sm font-medium text-gray-300 mb-2">From Date</label>
                                      <input
                                        type="date"
                                        value={advancedFilters.dateFrom || ''}
                                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, dateFrom: e.target.value || undefined }))}
                                        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-blue-400"
                                      />
                                    </div>
                                    
                                    <div>
                                      <label className="block text-sm font-medium text-gray-300 mb-2">To Date</label>
                                      <input
                                        type="date"
                                        value={advancedFilters.dateTo || ''}
                                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, dateTo: e.target.value || undefined }))}
                                        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-blue-400"
                                      />
                                    </div>
                                    
                                    {/* Min Score */}
                                    <div>
                                      <label className="block text-sm font-medium text-gray-300 mb-2">Min Match Score</label>
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        placeholder="e.g., 70"
                                        value={advancedFilters.minScore || ''}
                                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, minScore: e.target.value ? parseInt(e.target.value) : undefined }))}
                                        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:border-blue-400"
                                      />
                                    </div>
                                  </div>
                                  
                                  {/* Clear Filters Button */}
                                  <div className="mt-4 flex justify-end">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setAdvancedFilters({})}
                                      className="text-gray-300 hover:text-white"
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
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                          <h3 className="text-xl font-semibold text-white mb-2">Finding Opportunities</h3>
                          <p className="text-gray-300">Matching opportunities to your profile...</p>
                        </div>
                      ) : filteredOpportunities.length > 0 ? (
                        <div>
                          <div className="mb-4 text-gray-400 text-sm">
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
                              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 hover:bg-white/15 transition-all duration-300 hover:scale-[1.02]"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <TypeIcon className="h-5 w-5 text-blue-400" />
                                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getTypeColor(opportunity.type)}`}>
                                      {getTypeLabel(opportunity.type)}
                                    </span>
                                  </div>
                                  <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2">
                                    {opportunity.title}
                                  </h3>
                                  <p className="text-gray-300 text-base mb-3">{opportunity.organization}</p>
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
                                        className="p-2 rounded-full text-gray-400 hover:text-purple-400 hover:bg-purple-400/20 transition-all duration-200"
                                        title="Add to list"
                                      >
                                        <FolderPlus className="h-5 w-5" />
                                      </button>
                                      <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-lg border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                        <div className="py-2">
                                          {customLists.length === 0 ? (
                                            <button
                                              onClick={() => setShowCreateListModal(true)}
                                              className="w-full text-left px-4 py-2 text-sm text-purple-300 hover:bg-purple-500/20 transition-colors"
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
                                                        ? 'text-purple-300 bg-purple-500/20'
                                                        : 'text-gray-300 hover:bg-white/10'
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
                                              <div className="border-t border-white/10 my-1"></div>
                                              <button
                                                onClick={() => setShowCreateListModal(true)}
                                                className="w-full text-left px-4 py-2 text-sm text-blue-300 hover:bg-blue-500/20 transition-colors"
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
                                          ? 'text-yellow-400 bg-yellow-400/20 hover:bg-yellow-400/30' 
                                          : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/20'
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
                              
                              <div className="flex items-center text-gray-400 text-sm mb-4 space-x-6 flex-wrap">
                                <div className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-2" />
                                  {opportunity.isRemote ? 'Remote' : opportunity.location}
                                </div>
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-2" />
                                  {formatDate(opportunity.createdAt)}
                                </div>
                                {opportunity.deadline && (
                                  <div className="flex items-center text-orange-300">
                                    <Target className="h-4 w-4 mr-2" />
                                    Deadline: {new Date(opportunity.deadline).toLocaleDateString()}
                                  </div>
                                )}
                                {opportunity.salaryMin && opportunity.salaryMax && (
                                  <div className="flex items-center text-green-300">
                                    <TrendingUp className="h-4 w-4 mr-2" />
                                    {opportunity.currency || 'NZD'} {opportunity.salaryMin.toLocaleString()} - {opportunity.salaryMax.toLocaleString()}
                                  </div>
                                )}
                              </div>

                              <p className="text-gray-300 text-base mb-4 line-clamp-3 leading-relaxed">
                                {opportunity.description}
                              </p>

                              {opportunity.tags && opportunity.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {opportunity.tags.slice(0, 5).map((tag, idx) => (
                                    <span key={idx} className="text-xs bg-white/5 text-gray-400 px-2 py-1 rounded">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}

                              <div className="flex items-center justify-between">
                                {opportunity.category && (
                                  <span className="text-sm text-gray-400 capitalize bg-white/5 px-3 py-1 rounded-full">
                                    {opportunity.category}
                                  </span>
                                )}
                                <div className="flex items-center space-x-3 ml-auto">
                                  <a
                                    href={opportunity.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105"
                                  >
                                    {opportunity.type === 'scholarship' ? 'Learn More' : opportunity.type === 'event' ? 'Register' : opportunity.type === 'club' ? 'Join' : 'Apply Now'}
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
                              <Star className="h-20 w-20 text-gray-500 mx-auto mb-6" />
                              <h3 className="text-2xl font-semibold text-white mb-3">No Saved Opportunities</h3>
                              <p className="text-gray-400 mb-6 max-w-md mx-auto">You haven&apos;t saved any opportunities yet. Star opportunities you&apos;re interested in to save them here.</p>
                              <Button
                                variant="outline"
                                onClick={() => setActiveTab('all')}
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                              >
                                Browse Opportunities
                              </Button>
                            </>
                          ) : customLists.some(list => list.id === activeTab) ? (
                            <>
                              <FolderPlus className="h-20 w-20 text-gray-500 mx-auto mb-6" />
                              <h3 className="text-2xl font-semibold text-white mb-3">List is Empty</h3>
                              <p className="text-gray-400 mb-6 max-w-md mx-auto">This list doesn&apos;t have any opportunities yet. Use the folder icon on opportunities to add them to this list.</p>
                              <Button
                                variant="outline"
                                onClick={() => setActiveTab('all')}
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                              >
                                Browse Opportunities
                              </Button>
                            </>
                          ) : (
                            <>
                              <Zap className="h-20 w-20 text-gray-500 mx-auto mb-6" />
                              <h3 className="text-2xl font-semibold text-white mb-3">No Opportunities Found</h3>
                              <p className="text-gray-400 mb-6 max-w-md mx-auto">
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
                                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                                  >
                                    Clear Search
                                  </Button>
                                )}
                                <Link href="/profile">
                                  <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300">
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
              className="bg-slate-800 rounded-lg border border-white/10 p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-semibold text-white mb-4">Create New List</h3>
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
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:border-blue-400 mb-4"
                autoFocus
              />
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateListModal(false);
                    setNewListName('');
                  }}
                  className="text-gray-300 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={createCustomList}
                  disabled={!newListName.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
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

'use client';

import { useEffect, useState, useCallback } from 'react';
import { GraduationCap, Calendar, BookOpen, Users, Plus, Edit3, Trash2, Award, Target, Clock, CheckCircle, AlertCircle, TrendingUp, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AcademicInputModal from './AcademicInputModal';
import DegreeProgressModal from './DegreeProgressModal';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface CareerInsightsPanelProps {
  formData: any;
  cvScore: number | string | null;
}

interface AcademicItem {
  id: string;
  title: string;
  deadline?: string;
  progress?: number;
  type?: string;
  role?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'not-started' | 'in-progress' | 'completed' | 'overdue';
  grade?: string;
  credits?: number;
}

interface AcademicProgress {
  semestersRemaining: number;
  totalSemestersRequired: number;
  creditsCompleted?: number;
  totalCredits?: number;
  graduationDate: string;
  currentPapers: AcademicItem[];
  upcomingAssessments: AcademicItem[];
  clubs: AcademicItem[];
  gpa?: number;
  targetGpa?: number;
  completedCourses: AcademicItem[];
  achievements: AcademicItem[];
}

export default function CareerInsightsPanel({ formData, cvScore }: CareerInsightsPanelProps) {
  const { user } = useAuth();
  // Helper function to safely extract numerical CV score
  const getNumericalCVScore = (): number => {
    if (!cvScore) return 0;
    
    if (typeof cvScore === 'string') {
      if (!cvScore.trim()) return 0;
      const scoreMatch = cvScore.match(/Overall Score \(0–100\): (\d+)/);
      return scoreMatch ? parseInt(scoreMatch[1]) : 0;
    }
    
    return typeof cvScore === 'number' ? cvScore : 0;
  };

  const [academicProgress, setAcademicProgress] = useState<AcademicProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [academicProgressLoaded, setAcademicProgressLoaded] = useState(false);
  const [activeAcademicTab, setActiveAcademicTab] = useState<'progress' | 'achievements'>('progress');
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [modalItemType, setModalItemType] = useState<'paper' | 'assessment' | 'club' | 'achievement' | 'course'>('paper');
  const [editingItem, setEditingItem] = useState<AcademicItem | undefined>();
  
  // Degree progress modal state
  const [degreeModalOpen, setDegreeModalOpen] = useState(false);

  const saveAcademicProgress = useCallback(async (progress: AcademicProgress) => {
    try {
      // Clean the progress data to remove any undefined values
      const cleanProgress = JSON.parse(JSON.stringify(progress));
      
      // Save to localStorage
      const progressString = JSON.stringify(cleanProgress);
      localStorage.setItem('gradual_academic_progress', progressString);
      console.log('Academic progress saved to localStorage successfully:', cleanProgress);
      
      // Also save to Firebase as backup
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          await setDoc(userRef, { academicProgress: cleanProgress }, { merge: true });
          console.log('Academic progress saved to Firebase successfully');
          
        } catch (firebaseError) {
          console.error('Error saving academic progress to Firebase:', firebaseError);
        }
      }
    } catch (error) {
      console.error('Error saving academic progress to localStorage:', error);
    }
  }, [user]);

  const initializeDefaultProgress = useCallback(async () => {
    const defaultProgress: AcademicProgress = {
      semestersRemaining: 3,
      totalSemestersRequired: 6,
      graduationDate: 'Spring 2025',
      gpa: 3.2,
      targetGpa: 3.5,
      currentPapers: [
        {
          id: '1',
          title: 'Capstone Project: AI-Powered Career Platform',
          deadline: '2024-12-15',
          progress: 65,
          priority: 'high',
          status: 'in-progress',
          credits: 6
        },
        {
          id: '2',
          title: 'Research Paper: Machine Learning Applications',
          deadline: '2024-11-30',
          progress: 40,
          priority: 'medium',
          status: 'in-progress',
          credits: 3
        }
      ],
      upcomingAssessments: [
        {
          id: '3',
          title: 'Data Structures Final',
          deadline: '2024-12-10',
          type: 'Final Exam',
          priority: 'high',
          status: 'not-started'
        },
        {
          id: '4',
          title: 'Software Engineering Project Demo',
          deadline: '2024-12-05',
          type: 'Presentation',
          priority: 'high',
          status: 'in-progress'
        }
      ],
      clubs: [
        {
          id: '5',
          title: 'Computer Science Club',
          role: 'Vice President',
          status: 'in-progress'
        },
        {
          id: '6',
          title: 'AI Research Group',
          role: 'Member',
          status: 'in-progress'
        }
      ],
      completedCourses: [
        {
          id: '7',
          title: 'Introduction to Programming',
          deadline: '2023-12',
          grade: 'A-',
          status: 'completed'
        },
        {
          id: '8',
          title: 'Data Structures and Algorithms',
          deadline: '2023-12',
          grade: 'B+',
          status: 'completed'
        }
      ],
      achievements: [
        {
          id: '9',
          title: 'Dean\'s List Fall 2023',
          deadline: '2023-12',
          type: 'Academic Achievement',
          status: 'completed',
          description: 'Achieved Dean\'s List recognition for maintaining a GPA above 3.5 during Fall 2023 semester.'
        },
        {
          id: '10',
          title: 'Hackathon Winner - Tech Innovation Challenge',
          deadline: '2024-03',
          type: 'Competition',
          status: 'completed',
          description: 'Won first place in the university\'s annual tech innovation hackathon with a team of 4 students, developing an AI-powered study assistant.'
        }
      ]
    };
    setAcademicProgress(defaultProgress);
    
    // Save to both localStorage and Firebase
    try {
      const progressString = JSON.stringify(defaultProgress);
      localStorage.setItem('gradual_academic_progress', progressString);
      console.log('Default academic progress saved to localStorage successfully:', defaultProgress);
      
      // Also save to Firebase
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          await setDoc(userRef, { academicProgress: defaultProgress }, { merge: true });
          console.log('Default academic progress saved to Firebase successfully');
        } catch (firebaseError) {
          console.error('Error saving default academic progress to Firebase:', firebaseError);
        }
      }
    } catch (error) {
      console.error('Error saving default academic progress to localStorage:', error);
    }
    setAcademicProgressLoaded(true);
  }, [user]);

  const loadAcademicProgress = useCallback(async () => {
    // Prevent multiple loads
    if (academicProgressLoaded) {
      console.log('Academic progress already loaded, skipping');
      return;
    }
    
    let progressFound = false;
    
    // First try to load from Firebase (more reliable across devices)
    if (user) {
      try {
        console.log('Attempting to load academic progress from Firebase...');
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists() && userSnap.data().academicProgress) {
          const firebaseProgress = userSnap.data().academicProgress;
          console.log('Found academic progress in Firebase:', firebaseProgress);
          
          // Ensure all arrays are initialized
          const initializedProgress = {
            ...firebaseProgress,
            completedCourses: firebaseProgress.completedCourses || [],
            achievements: firebaseProgress.achievements || []
          };
          
          setAcademicProgress(initializedProgress);
          setAcademicProgressLoaded(true);
          progressFound = true;
          
          // Also update localStorage with Firebase data
          try {
            localStorage.setItem('gradual_academic_progress', JSON.stringify(initializedProgress));
            console.log('Updated localStorage with Firebase data');
          } catch (localStorageError) {
            console.error('Error updating localStorage with Firebase data:', localStorageError);
          }
        }
      } catch (firebaseError) {
        console.error('Error loading academic progress from Firebase:', firebaseError);
      }
    }
    
    // If Firebase didn't work, try localStorage
    if (!progressFound) {
      try {
        const stored = localStorage.getItem('gradual_academic_progress');
        console.log('Loading academic progress from localStorage:', stored ? 'Data found' : 'No data found');
        
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            console.log('Successfully parsed academic progress from localStorage:', parsed);
            
            // Ensure all arrays are initialized
            const initializedProgress = {
              ...parsed,
              completedCourses: parsed.completedCourses || [],
              achievements: parsed.achievements || []
            };
            
            setAcademicProgress(initializedProgress);
            setAcademicProgressLoaded(true);
            progressFound = true;
            
            // Also save to Firebase for future consistency
            if (user) {
              try {
                const userRef = doc(db, 'users', user.uid);
                await setDoc(userRef, { academicProgress: initializedProgress }, { merge: true });
                console.log('Saved localStorage data to Firebase for consistency');
              } catch (firebaseError) {
                console.error('Error saving localStorage data to Firebase:', firebaseError);
              }
            }
          } catch (error) {
            console.error('Error parsing stored academic progress from localStorage:', error);
          }
        }
      } catch (error) {
        console.error('Error accessing localStorage:', error);
      }
    }
    
    // If neither Firebase nor localStorage worked, initialize with default data
    if (!progressFound) {
      console.log('No data found in Firebase or localStorage, initializing with default progress');
      await initializeDefaultProgress();
      setAcademicProgressLoaded(true);
    }
  }, [initializeDefaultProgress, academicProgressLoaded, user]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    
    // Load academic progress from Firebase/localStorage or initialize (only if not already loaded)
    if (!academicProgressLoaded) {
      await loadAcademicProgress();
    }
    
    setIsLoading(false);
  }, [loadAcademicProgress, academicProgressLoaded]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openAddModal = (itemType: 'paper' | 'assessment' | 'club' | 'achievement' | 'course') => {
    setModalItemType(itemType);
    setModalMode('add');
    setEditingItem(undefined);
    setModalOpen(true);
  };

  const openEditModal = (item: AcademicItem, itemType: 'paper' | 'assessment' | 'club' | 'achievement' | 'course') => {
    setModalItemType(itemType);
    setModalMode('edit');
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleSaveAcademicItem = async (item: AcademicItem) => {
    if (!academicProgress) return;

    const newProgress = { ...academicProgress };
    
    if (modalMode === 'add') {
      // Add new item
      switch (modalItemType) {
        case 'paper':
          newProgress.currentPapers = [...newProgress.currentPapers, item];
          break;
        case 'assessment':
          newProgress.upcomingAssessments = [...newProgress.upcomingAssessments, item];
          break;
        case 'club':
          newProgress.clubs = [...newProgress.clubs, item];
          break;
        case 'achievement':
          newProgress.achievements = [...newProgress.achievements, item];
          break;
        case 'course':
          newProgress.completedCourses = [...newProgress.completedCourses, item];
          break;
      }
    } else {
      // Edit existing item
      switch (modalItemType) {
        case 'paper':
          newProgress.currentPapers = newProgress.currentPapers.map(p => 
            p.id === item.id ? item : p
          );
          break;
        case 'assessment':
          newProgress.upcomingAssessments = newProgress.upcomingAssessments.map(a => 
            a.id === item.id ? item : a
          );
          break;
        case 'club':
          newProgress.clubs = newProgress.clubs.map(c => 
            c.id === item.id ? item : c
          );
          break;
        case 'achievement':
          newProgress.achievements = newProgress.achievements.map(a => 
            a.id === item.id ? item : a
          );
          break;
        case 'course':
          newProgress.completedCourses = newProgress.completedCourses.map(c => 
            c.id === item.id ? item : c
          );
          break;
      }
    }

    setAcademicProgress(newProgress);
    await saveAcademicProgress(newProgress);
  };

  const deleteAcademicItem = async (itemId: string, itemType: 'paper' | 'assessment' | 'club' | 'achievement' | 'course') => {
    if (!academicProgress) return;

    const newProgress = { ...academicProgress };
    
    switch (itemType) {
      case 'paper':
        newProgress.currentPapers = newProgress.currentPapers.filter(p => p.id !== itemId);
        break;
      case 'assessment':
        newProgress.upcomingAssessments = newProgress.upcomingAssessments.filter(a => a.id !== itemId);
        break;
      case 'club':
        newProgress.clubs = newProgress.clubs.filter(c => c.id !== itemId);
        break;
      case 'achievement':
        newProgress.achievements = newProgress.achievements.filter(a => a.id !== itemId);
        break;
      case 'course':
        newProgress.completedCourses = newProgress.completedCourses.filter(c => c.id !== itemId);
        break;
    }

    setAcademicProgress(newProgress);
    await saveAcademicProgress(newProgress);
  };

  const handleSaveDegreeProgress = async (data: {
    graduationDate: string;
    semestersRemaining: number;
    totalSemestersRequired: number;
    creditsCompleted?: number;
    totalCredits?: number;
    gpa?: number;
    targetGpa?: number;
  }) => {
    if (!academicProgress) return;
    
    const updatedProgress: AcademicProgress = {
      ...academicProgress,
      graduationDate: data.graduationDate,
      semestersRemaining: data.semestersRemaining,
      totalSemestersRequired: data.totalSemestersRequired
    };

    // Only add credit fields if they have values
    if (data.creditsCompleted && data.totalCredits) {
      updatedProgress.creditsCompleted = data.creditsCompleted;
      updatedProgress.totalCredits = data.totalCredits;
    } else {
      // Remove credit fields if they exist
      delete updatedProgress.creditsCompleted;
      delete updatedProgress.totalCredits;
    }

    // Add GPA fields if provided
    if (data.gpa !== undefined) {
      updatedProgress.gpa = data.gpa;
    }
    if (data.targetGpa !== undefined) {
      updatedProgress.targetGpa = data.targetGpa;
    }
    
    setAcademicProgress(updatedProgress);
    await saveAcademicProgress(updatedProgress);
    setDegreeModalOpen(false);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'from-green-500 to-emerald-500';
    if (progress >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-900/30';
      case 'medium': return 'text-yellow-400 bg-yellow-900/30';
      case 'low': return 'text-green-400 bg-green-900/30';
      default: return 'text-gray-400 bg-gray-900/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-900/30';
      case 'in-progress': return 'text-blue-400 bg-blue-900/30';
      case 'overdue': return 'text-red-400 bg-red-900/30';
      case 'not-started': return 'text-gray-400 bg-gray-900/30';
      default: return 'text-gray-400 bg-gray-900/30';
    }
  };

  const formatDeadline = (deadline: string) => {
    if (!deadline) return '';
    
    try {
      // Check if it's a month-year format (YYYY-MM)
      if (deadline.match(/^\d{4}-\d{2}$/)) {
        const date = new Date(deadline + '-01'); // Add day to make it a valid date
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }
      
      // Check if it's a full date format
      const date = new Date(deadline);
      if (isNaN(date.getTime())) return deadline; // Return as-is if invalid
      
      const daysLeft = Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft < 0) return 'Overdue';
      if (daysLeft === 0) return 'Due today';
      if (daysLeft === 1) return 'Due tomorrow';
      return `${daysLeft} days left`;
    } catch (error) {
      return deadline; // Return as-is if parsing fails
    }
  };

  const getGpaColor = (gpa: number) => {
    if (gpa >= 3.7) return 'text-green-400';
    if (gpa >= 3.3) return 'text-blue-400';
    if (gpa >= 3.0) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 animate-slide-in-up stagger-2">
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 backdrop-blur-md border-green-400/20 shadow-xl">
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-green-800/50 rounded mb-4"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-green-800/30 rounded-lg p-3">
                    <div className="h-4 bg-green-700/50 rounded mb-2"></div>
                    <div className="h-3 bg-green-700/30 rounded mb-2"></div>
                    <div className="h-3 bg-green-700/30 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 animate-slide-in-up stagger-2">
        {/* Left Panel: Academic Progress & Management */}
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 backdrop-blur-md border-green-400/20 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <GraduationCap className="h-5 w-5 text-green-400 mr-2" />
                <h3 className="text-lg font-semibold text-white">Academic Progress</h3>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-2 mb-6">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <button
                  onClick={() => setActiveAcademicTab('progress')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 sm:px-4 rounded-md transition-all duration-300 text-sm ${
                    activeAcademicTab === 'progress'
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <BookOpen className="h-4 w-4 sm:h-4 sm:w-4" />
                  Progress
                </button>
                <button
                  onClick={() => setActiveAcademicTab('achievements')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 sm:px-4 rounded-md transition-all duration-300 text-sm ${
                    activeAcademicTab === 'achievements'
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Award className="h-4 w-4 sm:h-4 sm:w-4" />
                  Achievements/Goals
                </button>
              </div>
            </div>

            {academicProgress && (
              <div className="space-y-4">
                {/* Progress Tab Content */}
                {activeAcademicTab === 'progress' && (
                  <>
                    {/* Degree Progress */}
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-white font-medium">Degree Progress</span>
                        <Button
                          onClick={() => setDegreeModalOpen(true)}
                          size="sm"
                          variant="ghost"
                          className="h-5 w-5 p-0 text-gray-400 hover:text-green-300 transition-colors"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {/* GPA Display */}
                      {academicProgress.gpa && (
                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-300">Current GPA</span>
                            <span className={`text-xs font-medium ${getGpaColor(academicProgress.gpa)}`}>
                              {academicProgress.gpa.toFixed(2)}
                            </span>
                          </div>
                          {academicProgress.targetGpa && (
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-300">Target GPA</span>
                              <span className="text-xs text-blue-300">
                                {academicProgress.targetGpa.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Semester Progress Bar - Always Visible */}
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-300">Semester Progress</span>
                          <span className="text-xs text-green-300">
                            {academicProgress.totalSemestersRequired - academicProgress.semestersRemaining}/{academicProgress.totalSemestersRequired} semesters
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className={`bg-gradient-to-r ${getProgressColor(((academicProgress.totalSemestersRequired - academicProgress.semestersRemaining) / academicProgress.totalSemestersRequired) * 100)} h-2 rounded-full transition-all duration-1000 ease-out`}
                            style={{ width: `${((academicProgress.totalSemestersRequired - academicProgress.semestersRemaining) / academicProgress.totalSemestersRequired) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Credit Progress Bar - Only show if credits are entered */}
                      {academicProgress.creditsCompleted && academicProgress.totalCredits && (
                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-300">Credit Progress</span>
                            <span className="text-xs text-blue-300">
                              {academicProgress.creditsCompleted}/{academicProgress.totalCredits} credits
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                              className={`bg-gradient-to-r ${getProgressColor((academicProgress.creditsCompleted / academicProgress.totalCredits) * 100)} h-2 rounded-full transition-all duration-1000 ease-out`}
                              style={{ width: `${(academicProgress.creditsCompleted / academicProgress.totalCredits) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-between text-xs text-gray-300">
                        <span>{academicProgress.semestersRemaining} semesters remaining</span>
                        <span>Graduate {academicProgress.graduationDate}</span>
                      </div>
                    </div>

                    {/* Current Courses */}
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 text-green-400 mr-2" />
                          <span className="text-sm text-white font-medium">Current Courses</span>
                        </div>
                        <Button
                          onClick={() => openAddModal('paper')}
                          size="sm"
                          className="h-6 px-2 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {(academicProgress.currentPapers || []).map((paper, index) => (
                          <div key={paper.id} className="text-xs group relative">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-white font-medium line-clamp-1">{paper.title}</span>
                              <div className="flex items-center space-x-1">
                                {paper.priority && (
                                  <span className={`text-xs px-1 py-0.5 rounded ${getPriorityColor(paper.priority)}`}>
                                    {paper.priority}
                                  </span>
                                )}
                                <span className="text-green-300">{paper.progress}%</span>
                                <Button
                                  onClick={() => openEditModal(paper, 'paper')}
                                  size="sm"
                                  variant="ghost"
                                  className="h-4 w-4 p-0 text-gray-400 hover:text-green-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Edit3 className="h-3 w-3" />
                                </Button>
                                <Button
                                  onClick={() => deleteAcademicItem(paper.id, 'paper')}
                                  size="sm"
                                  variant="ghost"
                                  className="h-4 w-4 p-0 text-gray-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden mb-1">
                              <div
                                className={`bg-gradient-to-r ${getProgressColor(paper.progress || 0)} h-1.5 rounded-full transition-all duration-500`}
                                style={{ width: `${paper.progress || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-gray-400">{formatDeadline(paper.deadline || '')}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Upcoming Assessments */}
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-green-400 mr-2" />
                          <span className="text-sm text-white font-medium">Upcoming Assessments</span>
                        </div>
                        <Button
                          onClick={() => openAddModal('assessment')}
                          size="sm"
                          className="h-6 px-2 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {(academicProgress.upcomingAssessments || []).map((assessment, index) => (
                          <div key={assessment.id} className="text-xs group relative">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="text-white font-medium">{assessment.title}</span>
                                <div className="text-gray-400">{assessment.type}</div>
                              </div>
                              <div className="flex items-center space-x-1">
                                {assessment.priority && (
                                  <span className={`text-xs px-1 py-0.5 rounded ${getPriorityColor(assessment.priority)}`}>
                                    {assessment.priority}
                                  </span>
                                )}
                                <span className="text-green-300">{formatDeadline(assessment.deadline || '')}</span>
                                <Button
                                  onClick={() => openEditModal(assessment, 'assessment')}
                                  size="sm"
                                  variant="ghost"
                                  className="h-4 w-4 p-0 text-gray-400 hover:text-green-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Edit3 className="h-3 w-3" />
                                </Button>
                                <Button
                                  onClick={() => deleteAcademicItem(assessment.id, 'assessment')}
                                  size="sm"
                                  variant="ghost"
                                  className="h-4 w-4 p-0 text-gray-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* University Clubs */}
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-green-400 mr-2" />
                          <span className="text-sm text-white font-medium">University Involvement</span>
                        </div>
                        <Button
                          onClick={() => openAddModal('club')}
                          size="sm"
                          className="h-6 px-2 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {(academicProgress.clubs || []).map((club, index) => (
                          <div key={club.id} className="text-xs group relative">
                            <div className="flex justify-between items-center">
                              <span className="text-white">{club.title}</span>
                              <div className="flex items-center space-x-1">
                                <span className="text-green-300 bg-green-900/50 px-2 py-1 rounded-full">
                                  {club.role}
                                </span>
                                <Button
                                  onClick={() => openEditModal(club, 'club')}
                                  size="sm"
                                  variant="ghost"
                                  className="h-4 w-4 p-0 text-gray-400 hover:text-green-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Edit3 className="h-3 w-3" />
                                </Button>
                                <Button
                                  onClick={() => deleteAcademicItem(club.id, 'club')}
                                  size="sm"
                                  variant="ghost"
                                  className="h-4 w-4 p-0 text-gray-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Achievements Tab Content */}
                {activeAcademicTab === 'achievements' && (
                  <>
                    {/* Completed Courses */}
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                          <span className="text-sm text-white font-medium">Completed Courses</span>
                        </div>
                        <Button
                          onClick={() => openAddModal('course')}
                          size="sm"
                          className="h-6 px-2 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {(academicProgress.completedCourses || []).map((course, index) => (
                          <div key={course.id} className="text-xs group relative">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="text-white font-medium">{course.title}</span>
                                <div className="text-gray-400">{formatDeadline(course.deadline || '')}</div>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span className={`text-xs px-2 py-1 rounded ${getGpaColor(parseFloat(course.grade || '0'))}`}>
                                  {course.grade}
                                </span>
                                <Button
                                  onClick={() => openEditModal(course, 'course')}
                                  size="sm"
                                  variant="ghost"
                                  className="h-4 w-4 p-0 text-gray-400 hover:text-green-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Edit3 className="h-3 w-3" />
                                </Button>
                                <Button
                                  onClick={() => deleteAcademicItem(course.id, 'course')}
                                  size="sm"
                                  variant="ghost"
                                  className="h-4 w-4 p-0 text-gray-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Achievements */}
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <Award className="h-4 w-4 text-green-400 mr-2" />
                          <span className="text-sm text-white font-medium">Achievements</span>
                        </div>
                        <Button
                          onClick={() => openAddModal('achievement')}
                          size="sm"
                          className="h-6 px-2 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {(academicProgress.achievements || []).map((achievement, index) => (
                          <div key={achievement.id} className="text-xs group relative">
                            <div className="flex justify-between items-center">
                              <div className="flex-1">
                                <span className="text-white font-medium">{achievement.title}</span>
                                <div className="text-gray-400">{achievement.type}</div>
                                {achievement.description && (
                                  <details className="mt-1">
                                    <summary className="text-blue-400 cursor-pointer hover:text-blue-300 text-xs">
                                      View Description
                                    </summary>
                                    <div className="mt-1 p-2 bg-blue-900/20 rounded border border-blue-800/30">
                                      <p className="text-blue-200 text-xs leading-relaxed">
                                        {achievement.description}
                                      </p>
                                    </div>
                                  </details>
                                )}
                              </div>
                              <div className="flex items-center space-x-1">
                                <span className={`text-xs px-2 py-1 rounded ${getStatusColor(achievement.status || 'completed')}`}>
                                  {achievement.status || 'completed'}
                                </span>
                                <Button
                                  onClick={() => openEditModal(achievement, 'achievement')}
                                  size="sm"
                                  variant="ghost"
                                  className="h-4 w-4 p-0 text-gray-400 hover:text-green-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Edit3 className="h-3 w-3" />
                                </Button>
                                <Button
                                  onClick={() => deleteAcademicItem(achievement.id, 'achievement')}
                                  size="sm"
                                  variant="ghost"
                                  className="h-4 w-4 p-0 text-gray-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>


                    {/* Academic Statistics */}
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3">
                      <div className="flex items-center mb-3">
                        <BarChart3 className="h-4 w-4 text-green-400 mr-2" />
                        <span className="text-sm text-white font-medium">Academic Statistics</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="text-center">
                          <div className="text-green-300 font-medium">
                            {(academicProgress.completedCourses || []).length}
                          </div>
                          <div className="text-gray-400">Courses Completed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-green-300 font-medium">
                            {(academicProgress.achievements || []).length}
                          </div>
                          <div className="text-gray-400">Achievements</div>
                        </div>
                        <div className="text-center">
                          <div className="text-green-300 font-medium">
                            {(academicProgress.clubs || []).length}
                          </div>
                          <div className="text-gray-400">Clubs/Activities</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Academic Input Modal */}
      <AcademicInputModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        itemType={modalItemType}
        existingItem={editingItem}
        onSave={handleSaveAcademicItem}
      />

      {/* Degree Progress Modal */}
      <DegreeProgressModal
        isOpen={degreeModalOpen}
        onClose={() => setDegreeModalOpen(false)}
        onSave={handleSaveDegreeProgress}
        currentData={{
          graduationDate: academicProgress?.graduationDate || '',
          semestersRemaining: academicProgress?.semestersRemaining || 0,
          totalSemestersRequired: academicProgress?.totalSemestersRequired || 6,
          creditsCompleted: academicProgress?.creditsCompleted,
          totalCredits: academicProgress?.totalCredits,
          gpa: academicProgress?.gpa,
          targetGpa: academicProgress?.targetGpa
        }}
      />
    </>
  );
}

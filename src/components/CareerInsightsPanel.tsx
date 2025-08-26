'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, GraduationCap, Calendar, BookOpen, Users, Plus, ChevronDown, ChevronUp, Edit3, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { aiInsightsService, type IndustryInsight } from '@/lib/ai-insights-service';
import AcademicInputModal from './AcademicInputModal';
import DegreeProgressModal from './DegreeProgressModal';

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
}

export default function CareerInsightsPanel({ formData, cvScore }: CareerInsightsPanelProps) {
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

  const [industryInsights, setIndustryInsights] = useState<IndustryInsight[]>([]);
  const [academicProgress, setAcademicProgress] = useState<AcademicProgress | null>(null);
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [modalItemType, setModalItemType] = useState<'paper' | 'assessment' | 'club'>('paper');
  const [editingItem, setEditingItem] = useState<AcademicItem | undefined>();
  
  // Degree progress modal state
  const [degreeModalOpen, setDegreeModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [formData]);

  const loadData = async () => {
    setIsLoading(true);
    
    // Load AI insights
    const insights = await aiInsightsService.generateInsights({
      degree: formData.degree,
      interests: formData.interests,
      city: formData.city,
      country: formData.country,
      gpa: formData.gpa
    });
    setIndustryInsights(insights);
    
    // Load academic progress from localStorage or initialize
    loadAcademicProgress();
    
    setIsLoading(false);
  };

  const loadAcademicProgress = () => {
    const stored = localStorage.getItem('gradual_academic_progress');
      if (stored) {
        setAcademicProgress(JSON.parse(stored));
      } else {
        // Initialize with default data
        const defaultProgress: AcademicProgress = {
          semestersRemaining: 3,
          totalSemestersRequired: 6,
          graduationDate: 'Spring 2025',
          currentPapers: [
            {
              id: '1',
              title: 'Capstone Project: AI-Powered Career Platform',
              deadline: '2024-12-15',
              progress: 65
            },
            {
              id: '2',
              title: 'Research Paper: Machine Learning Applications',
              deadline: '2024-11-30',
              progress: 40
            }
          ],
          upcomingAssessments: [
            {
              id: '3',
              title: 'Data Structures Final',
              deadline: '2024-12-10',
              type: 'Final Exam'
            },
            {
              id: '4',
              title: 'Software Engineering Project Demo',
              deadline: '2024-12-05',
              type: 'Presentation'
            }
          ],
          clubs: [
            {
              id: '5',
              title: 'Computer Science Club',
              role: 'Vice President'
            },
            {
              id: '6',
              title: 'AI Research Group',
              role: 'Member'
            }
          ]
        };
        setAcademicProgress(defaultProgress);
        saveAcademicProgress(defaultProgress);
      }
  };

  const saveAcademicProgress = (progress: AcademicProgress) => {
    localStorage.setItem('gradual_academic_progress', JSON.stringify(progress));
  };

  const toggleInsightExpansion = (insightId: string) => {
    const newExpanded = new Set(expandedInsights);
    if (newExpanded.has(insightId)) {
      newExpanded.delete(insightId);
    } else {
      newExpanded.add(insightId);
    }
    setExpandedInsights(newExpanded);
  };

  const openAddModal = (itemType: 'paper' | 'assessment' | 'club') => {
    setModalItemType(itemType);
    setModalMode('add');
    setEditingItem(undefined);
    setModalOpen(true);
  };

  const openEditModal = (item: AcademicItem, itemType: 'paper' | 'assessment' | 'club') => {
    setModalItemType(itemType);
    setModalMode('edit');
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleSaveAcademicItem = (item: AcademicItem) => {
    if (!academicProgress) return;

    const newProgress = { ...academicProgress };
    
    if (modalMode === 'add') {
      // Add new item
      switch (modalItemType) {
        case 'paper':
          newProgress.currentPapers.push(item);
          break;
        case 'assessment':
          newProgress.upcomingAssessments.push(item);
          break;
        case 'club':
          newProgress.clubs.push(item);
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
      }
    }

    setAcademicProgress(newProgress);
    saveAcademicProgress(newProgress);
  };

  const deleteAcademicItem = (itemId: string, itemType: 'paper' | 'assessment' | 'club') => {
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
    }

    setAcademicProgress(newProgress);
    saveAcademicProgress(newProgress);
  };

  const handleSaveDegreeProgress = (data: {
    graduationDate: string;
    semestersRemaining: number;
    totalSemestersRequired: number;
    creditsCompleted?: number;
    totalCredits?: number;
  }) => {
    if (!academicProgress) return;
    
    const updatedProgress: AcademicProgress = {
      ...academicProgress,
      graduationDate: data.graduationDate,
      semestersRemaining: data.semestersRemaining,
      totalSemestersRequired: data.totalSemestersRequired,
      ...(data.creditsCompleted && data.totalCredits ? {
        creditsCompleted: data.creditsCompleted,
        totalCredits: data.totalCredits
      } : {
        creditsCompleted: undefined,
        totalCredits: undefined
      })
    };
    
    setAcademicProgress(updatedProgress);
    saveAcademicProgress(updatedProgress);
    setDegreeModalOpen(false);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'from-green-500 to-emerald-500';
    if (progress >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const formatDeadline = (deadline: string) => {
    const daysLeft = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return 'Overdue';
    if (daysLeft === 0) return 'Due today';
    if (daysLeft === 1) return 'Due tomorrow';
    return `${daysLeft} days left`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-in-up stagger-2">
        <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 backdrop-blur-md border-blue-400/20 shadow-xl">
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-blue-800/50 rounded mb-4"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-blue-800/30 rounded-lg p-3">
                    <div className="h-4 bg-blue-700/50 rounded mb-2"></div>
                    <div className="h-3 bg-blue-700/30 rounded mb-2"></div>
                    <div className="h-3 bg-blue-700/30 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-in-up stagger-2">
        {/* Left Panel: Industry Insights */}
        <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 backdrop-blur-md border-blue-400/20 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-blue-400 mr-2" />
                <h3 className="text-lg font-semibold text-white">Industry Insights</h3>
              </div>
              <Button
                onClick={() => aiInsightsService.refreshInsights({
                  degree: formData.degree,
                  interests: formData.interests,
                  city: formData.city,
                  country: formData.country,
                  gpa: formData.gpa
                }).then(setIndustryInsights)}
                variant="ghost"
                size="sm"
                className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/30"
              >
                Refresh
              </Button>
            </div>
            
            <div className="space-y-4">
              {industryInsights.map((insight) => (
                <div key={insight.id} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 hover:bg-white/15 transition-colors duration-200">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-blue-300 bg-blue-900/50 px-2 py-1 rounded-full">
                      {insight.category}
                    </span>
                    <span className="text-xs text-gray-400">{insight.timestamp}</span>
                  </div>
                  <h4 className="text-sm font-medium text-white mb-2 line-clamp-2">
                    {insight.title}
                  </h4>
                  <p className="text-xs text-gray-300 line-clamp-3 mb-3">
                    {insight.summary}
                  </p>
                  
                  {insight.expandedDetails && (
                    <div className="mb-3">
                      <button
                        onClick={() => toggleInsightExpansion(insight.id)}
                        className="flex items-center text-xs text-blue-400 hover:text-blue-300 transition-colors duration-200"
                      >
                        {expandedInsights.has(insight.id) ? (
                          <>
                            <ChevronUp className="h-3 w-3 mr-1" />
                            Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3 mr-1" />
                            Show more
                          </>
                        )}
                      </button>
                      
                      {expandedInsights.has(insight.id) && (
                        <div className="mt-2 p-2 bg-blue-900/20 rounded border border-blue-800/30">
                          <p className="text-xs text-blue-200 leading-relaxed">
                            {insight.expandedDetails}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                      <span className="text-xs text-blue-300">{insight.relevance}% relevant</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right Panel: Academic Progress & Management */}
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 backdrop-blur-md border-green-400/20 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <GraduationCap className="h-5 w-5 text-green-400 mr-2" />
                <h3 className="text-lg font-semibold text-white">Academic Progress</h3>
              </div>
            </div>

            {academicProgress && (
              <div className="space-y-4">
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
                    {academicProgress.currentPapers.map((paper, index) => (
                      <div key={paper.id} className="text-xs group relative">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-white font-medium line-clamp-1">{paper.title}</span>
                          <div className="flex items-center space-x-1">
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
                    {academicProgress.upcomingAssessments.map((assessment, index) => (
                      <div key={assessment.id} className="text-xs group relative">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-white font-medium">{assessment.title}</span>
                            <div className="text-gray-400">{assessment.type}</div>
                          </div>
                          <div className="flex items-center space-x-1">
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
                    {academicProgress.clubs.map((club, index) => (
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
          totalCredits: academicProgress?.totalCredits
        }}
      />
    </>
  );
}

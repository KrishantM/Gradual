'use client';

import { useState, useEffect } from 'react';
import { Trophy, Star, Target, Zap, BookOpen, Globe, Code, Heart, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'profile' | 'cv' | 'academic' | 'social' | 'special';
  unlocked: boolean;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
}

interface AchievementSystemProps {
  userId: string;
  profileData: any;
  cvScore: number | string | null;
}

export default function AchievementSystem({ userId, profileData, cvScore }: AchievementSystemProps) {
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

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showUnlocked, setShowUnlocked] = useState(true);

  useEffect(() => {
    generateAchievements();
  }, [profileData, cvScore]);

  const generateAchievements = () => {
    const allAchievements: Achievement[] = [
      // Profile Achievements
      {
        id: 'profile-master',
        name: 'Profile Master',
        description: 'Complete all required profile fields',
        icon: '👤',
        category: 'profile',
        unlocked: isProfileComplete(),
        progress: getProfileCompletion(),
        maxProgress: 100
      },
      {
        id: 'storyteller',
        name: 'Storyteller',
        description: 'Write a compelling bio (100+ characters)',
        icon: '✍️',
        category: 'profile',
        unlocked: profileData.bio && profileData.bio.length >= 100,
        progress: profileData.bio ? Math.min(100, profileData.bio.length) : 0,
        maxProgress: 100
      },
      {
        id: 'networker',
        name: 'Networker',
        description: 'Add portfolio and social links',
        icon: '🔗',
        category: 'profile',
        unlocked: !!(profileData.portfolioLinks && profileData.portfolioLinks.trim() !== ''),
        progress: profileData.portfolioLinks ? 100 : 0,
        maxProgress: 100
      },

      // CV Achievements
      {
        id: 'cv-novice',
        name: 'CV Novice',
        description: 'Upload your first CV',
        icon: '📄',
        category: 'cv',
        unlocked: !!(profileData.uploadedCVName),
        progress: profileData.uploadedCVName ? 100 : 0,
        maxProgress: 100
      },
      {
        id: 'cv-champion',
        name: 'CV Champion',
        description: 'Achieve a CV score of 80+',
        icon: '🏆',
        category: 'cv',
        unlocked: getNumericalCVScore() >= 80,
        progress: getNumericalCVScore(),
        maxProgress: 100
      },
      {
        id: 'cv-legend',
        name: 'CV Legend',
        description: 'Achieve a CV score of 90+',
        icon: '👑',
        category: 'cv',
        unlocked: getNumericalCVScore() >= 90,
        progress: getNumericalCVScore(),
        maxProgress: 100
      },

      // Academic Achievements
      {
        id: 'academic-excellence',
        name: 'Academic Excellence',
        description: 'Maintain a GPA of 3.8+',
        icon: '📚',
        category: 'academic',
        unlocked: !!(profileData.gpa && parseFloat(profileData.gpa) >= 3.8),
        progress: profileData.gpa ? parseFloat(profileData.gpa) : 0,
        maxProgress: 4.0
      },
      {
        id: 'diverse-interests',
        name: 'Diverse Interests',
        description: 'List 3+ areas of interest',
        icon: '🌟',
        category: 'academic',
        unlocked: !!(profileData.interests && profileData.interests.split(',').length >= 3),
        progress: profileData.interests ? Math.min(100, profileData.interests.split(',').length * 33.33) : 0,
        maxProgress: 100
      },

      // Social Achievements
      {
        id: 'early-adopter',
        name: 'Early Adopter',
        description: 'Join Gradual in the early stages',
        icon: '🚀',
        category: 'social',
        unlocked: true, // Always unlocked for early users
        progress: 100,
        maxProgress: 100
      },
      {
        id: 'consistency',
        name: 'Consistency King',
        description: 'Update your profile 3+ times',
        icon: '🔄',
        category: 'social',
        unlocked: false, // Would need to track profile updates
        progress: 0,
        maxProgress: 3
      }
    ];

    setAchievements(allAchievements);
  };

  const isProfileComplete = () => {
    const requiredFields = ['fullName', 'university', 'degree', 'gpa', 'interests', 'city', 'country'];
    return requiredFields.every(field => profileData[field] && profileData[field].toString().trim() !== '');
  };

  const getProfileCompletion = () => {
    const requiredFields = ['fullName', 'university', 'degree', 'gpa', 'interests', 'city', 'country'];
    const completedFields = requiredFields.filter(field => profileData[field] && profileData[field].toString().trim() !== '');
    return Math.round((completedFields.length / requiredFields.length) * 100);
  };

  const getUnlockedCount = () => achievements.filter(a => a.unlocked).length;
  const getTotalCount = () => achievements.length;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'profile': return <User className="h-4 w-4" />;
      case 'cv': return <Target className="h-4 w-4" />;
      case 'academic': return <BookOpen className="h-4 w-4" />;
      case 'social': return <Globe className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'profile': return 'from-blue-500/20 to-cyan-500/20 border-blue-400/30';
      case 'cv': return 'from-purple-500/20 to-pink-500/20 border-purple-400/30';
      case 'academic': return 'from-green-500/20 to-emerald-500/20 border-green-400/30';
      case 'social': return 'from-orange-500/20 to-red-500/20 border-orange-400/30';
      default: return 'from-gray-500/20 to-slate-500/20 border-gray-400/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Achievement Stats */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center justify-center">
          <Trophy className="h-6 w-6 text-yellow-400 mr-2 animate-float" />
          Achievement System
        </h2>
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 rounded-lg p-4 inline-block">
          <div className="text-3xl font-bold text-yellow-400">{getUnlockedCount()}</div>
          <div className="text-yellow-300 text-sm">of {getTotalCount()} Achievements Unlocked</div>
        </div>
      </div>

      {/* Achievement Filters */}
      <div className="flex justify-center space-x-2">
        <button
          onClick={() => setShowUnlocked(true)}
          className={`px-4 py-2 rounded-lg transition-all duration-300 ${
            showUnlocked 
              ? 'bg-blue-600 text-white' 
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          Unlocked ({getUnlockedCount()})
        </button>
        <button
          onClick={() => setShowUnlocked(false)}
          className={`px-4 py-2 rounded-lg transition-all duration-300 ${
            !showUnlocked 
              ? 'bg-blue-600 text-white' 
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          Locked ({getTotalCount() - getUnlockedCount()})
        </button>
      </div>

      {/* Achievements Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements
          .filter(achievement => showUnlocked ? achievement.unlocked : !achievement.unlocked)
          .map((achievement, index) => (
            <Card 
              key={achievement.id}
              className={`bg-gradient-to-br ${getCategoryColor(achievement.category)} backdrop-blur-md shadow-xl transition-all duration-300 hover:scale-105 animate-slide-in-up`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-4">
                <div className="text-center">
                  {/* Achievement Icon */}
                  <div className="text-4xl mb-3">
                    {achievement.icon}
                  </div>
                  
                  {/* Achievement Info */}
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {achievement.name}
                  </h3>
                  <p className="text-gray-300 text-sm mb-3">
                    {achievement.description}
                  </p>
                  
                  {/* Progress Bar - Only show for non-CV achievements */}
                  {achievement.progress !== undefined && achievement.maxProgress !== undefined && 
                   !achievement.id.startsWith('cv-') && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{achievement.progress}/{achievement.maxProgress}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-1000 ${
                            achievement.unlocked 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                              : 'bg-gradient-to-r from-blue-500 to-purple-500'
                          }`}
                          style={{ 
                            width: `${Math.min(100, (achievement.progress / achievement.maxProgress) * 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Status and Category Tags - Side by Side with Spacing */}
                  <div className="flex justify-center items-center space-x-3">
                    {/* Status Badge */}
                    <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                      achievement.unlocked
                        ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                        : 'bg-gray-500/20 text-gray-300 border border-gray-400/30'
                    }`}>
                      {achievement.unlocked ? (
                        <>
                          <Star className="h-3 w-3 mr-1.5 text-green-400" />
                          Unlocked
                        </>
                      ) : (
                        <>
                          <Target className="h-3 w-3 mr-1.5 text-gray-400" />
                          Locked
                        </>
                      )}
                    </div>
                    
                    {/* Category Badge */}
                    <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs text-gray-300 bg-white/10 border border-white/20">
                      {getCategoryIcon(achievement.category)}
                      <span className="ml-1.5 capitalize">{achievement.category}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Empty State */}
      {achievements.filter(a => showUnlocked ? a.unlocked : !a.unlocked).length === 0 && (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {showUnlocked ? 'No Achievements Yet' : 'All Achievements Unlocked!'}
          </h3>
          <p className="text-gray-400">
            {showUnlocked 
              ? 'Complete your profile and improve your CV to unlock achievements!' 
              : 'Congratulations! You\'ve unlocked all available achievements!'
            }
          </p>
        </div>
      )}
    </div>
  );
}

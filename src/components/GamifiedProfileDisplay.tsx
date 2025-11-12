'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { Trophy, Target, TrendingUp, Zap, Edit3, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import CareerInsightsPanel from './CareerInsightsPanel';

interface GamifiedProfileDisplayProps {
  formData: any;
  cvScore: number | string | null;
  onEditProfile: () => void;
  onViewCV: () => void;
}

export default function GamifiedProfileDisplay({ 
  formData, 
  cvScore, 
  onEditProfile, 
  onViewCV
}: GamifiedProfileDisplayProps) {
  const [achievements, setAchievements] = useState<string[]>([]);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);

  // Helper function to safely extract numerical CV score
  const getNumericalCVScore = useMemo((): number => {
    if (!cvScore) return 0;
    
    if (typeof cvScore === 'string') {
      if (!cvScore.trim()) return 0;
      const scoreMatch = cvScore.match(/Overall Score \(0–100\): (\d+)/);
      return scoreMatch ? parseInt(scoreMatch[1]) : 0;
    }
    
    return typeof cvScore === 'number' ? cvScore : 0;
  }, [cvScore]);


  const calculateGamificationStats = useCallback(() => {
    let profileCompletion = 0;
    let totalFields = 0;
    
    // Calculate profile completion percentage
    const requiredFields = ['fullName', 'university', 'degree', 'gpa', 'interests', 'city', 'country'];
    requiredFields.forEach(key => {
      totalFields++;
      if (formData[key] && formData[key].toString().trim() !== '') {
        profileCompletion++;
      }
    });
    
    // Calculate XP based on profile completion and CV score
    const profileXP = Math.round((profileCompletion / totalFields) * 100);
    const cvScoreXP = getNumericalCVScore;
    const totalXP = profileXP + cvScoreXP;
    
    // Calculate level (every 100 XP = 1 level, minimum level 1)
    const newLevel = Math.max(1, Math.floor(totalXP / 100) + 1);
    const newXP = totalXP % 100;
    
    setLevel(newLevel);
    setXp(newXP);
    
    // Generate achievements based on stats
    const newAchievements = [];
    if (profileCompletion === totalFields) newAchievements.push('Profile Master');
    if (cvScoreXP >= 80) newAchievements.push('CV Champion');
    if (cvScoreXP >= 90) newAchievements.push('CV Legend');
    if (formData.gpa && parseFloat(formData.gpa) >= 3.8) newAchievements.push('Academic Excellence');
    if (formData.bio && formData.bio.length > 100) newAchievements.push('Storyteller');
    
    setAchievements(newAchievements);
  }, [formData, getNumericalCVScore]);

  useEffect(() => {
    calculateGamificationStats();
  }, [calculateGamificationStats]);

  // Generate radar chart data with more relevant metrics
  const generateRadarData = () => {
    // CV Score - ensure it's a valid number
    const cvScoreValue = getNumericalCVScore;
    
    // Academic Performance - based on GPA and education completeness
    let academicScore = 0;
    if (formData.gpa && formData.gpaScale && formData.gpaScale !== 'other') {
      const gpaPercentage = calculateGPAPercentage(parseFloat(formData.gpa), formData.gpaScale);
      academicScore = gpaPercentage || 0;
    }
    // Bonus for having degree and university info
    if (formData.degree && formData.university) {
      academicScore = Math.min(100, academicScore + 10);
    }
    
    // Professional Presence - based on bio quality and professional indicators
    let professionalScore = 0;
    if (formData.bio && formData.bio.length > 150) {
      professionalScore = 100; // Excellent bio
    } else if (formData.bio && formData.bio.length > 100) {
      professionalScore = 80; // Good bio
    } else if (formData.bio && formData.bio.length > 50) {
      professionalScore = 60; // Basic bio
    }
    // Bonus for professional interests
    if (formData.interests && formData.interests.split(',').length >= 3) {
      professionalScore = Math.min(100, professionalScore + 15);
    }
    
    // Digital Footprint - based on portfolio, social links, and online presence
    let digitalScore = 0;
    if (formData.portfolioLinks && formData.portfolioLinks.trim() !== '') {
      digitalScore = 100; // Full score if portfolio links are added
    } else if (formData.bio && formData.bio.length > 100) {
      digitalScore = 70; // Good score if bio is substantial
    } else if (formData.bio && formData.bio.length > 50) {
      digitalScore = 50; // Medium score if bio exists
    }
    
    // Profile Completeness - based on required fields completion
    let completenessScore = 0;
    const requiredFields = ['fullName', 'university', 'degree', 'gpa', 'interests', 'city', 'country'];
    const completedFields = requiredFields.filter(field => formData[field] && formData[field].toString().trim() !== '');
    completenessScore = Math.round((completedFields.length / requiredFields.length) * 100);
    
    return [
      { metric: 'CV Score', value: cvScoreValue, fullMark: 100, color: '#3B82F6' },
      { metric: 'Academic', value: academicScore, fullMark: 100, color: '#10B981' },
      { metric: 'Professional', value: professionalScore, fullMark: 100, color: '#F59E0B' },
      { metric: 'Digital Presence', value: digitalScore, fullMark: 100, color: '#8B5CF6' },
      { metric: 'Completeness', value: completenessScore, fullMark: 100, color: '#EF4444' },
    ];
  };

  // Helper function to calculate GPA percentage
  const calculateGPAPercentage = (gpa: number, scale: string) => {
    if (scale === '100') {
      return Math.round(gpa);
    }
    if (scale === 'other') {
      return null;
    }
    
    const gpaValue = parseFloat(gpa.toString());
    if (isNaN(gpaValue) || gpaValue < 0) return 0;

    const maxScale = parseFloat(scale);
    
    let percentage: number;
    switch (scale) {
      case '4.0':
        percentage = (gpaValue / 4.0) * 100;
        break;
      case '5.0':
        percentage = (gpaValue / 5.0) * 100;
        break;
      case '7.0':
        percentage = (gpaValue / 7.0) * 100;
        break;
      case '9.0':
        percentage = (gpaValue / 9.0) * 100;
        break;
      case '10.0':
        percentage = (gpaValue / 10.0) * 100;
        break;
      default:
        percentage = gpaValue;
    }
    
    return Math.round(Math.min(percentage, 100));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* FIFA Card Style Profile */}
      <Card className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 backdrop-blur-md border-white/20 shadow-2xl overflow-hidden animate-slide-in-up">
        <CardContent className="p-0">
          <div className="relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20"></div>
            <div className="absolute top-4 right-4 animate-bounce-in stagger-1">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-2 py-1 rounded-full text-xs font-bold animate-glow cursor-help" title="Level increases with profile completion and CV score">
                Level {level}
              </div>
            </div>
            
            <div className="relative p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-center">
                {/* Profile Picture Placeholder */}
                <div className="text-center animate-slide-in-left stagger-1">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-xl font-bold text-white mb-2 animate-float">
                    {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="text-center">
                    <h2 className="text-lg font-bold text-white mb-1">
                      {formData.fullName || 'Your Name'}
                    </h2>
                    <p className="text-blue-300 text-xs mb-1">
                      {formData.degree || 'Your Degree'}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {formData.university || 'Your University'}
                    </p>
                  </div>
                </div>

                {/* Profile Overview */}
                <div className="flex justify-center animate-slide-in-up stagger-2">
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 w-full max-w-sm">
                    <h3 className="text-sm font-semibold text-white mb-2 text-center">Profile Overview</h3>
                    <div className="text-xs text-gray-300 space-y-1">
                      {formData.city && formData.country && (
                        <p>📍 {formData.city}, {formData.country}</p>
                      )}
                      {formData.age && (
                        <p>🎂 {formData.age} years old</p>
                      )}
                      {formData.bio && formData.bio.length > 50 && (
                        <p>💬 Bio: {formData.bio.substring(0, 60)}...</p>
                      )}
                      {formData.interests && (
                        <p>🌟 Interests: {formData.interests.split(',').slice(0, 2).join(', ')}</p>
                      )}
                      {formData.portfolioLinks && (
                        <p>🔗 Portfolio links added</p>
                      )}
                      {!formData.bio && !formData.portfolioLinks && !formData.interests && (
                        <p className="text-gray-400 italic">Complete your profile to see more details</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Achievements */}
                <div className="space-y-3 animate-slide-in-right stagger-3">
                  <h3 className="text-base font-semibold text-white mb-3 flex items-center justify-center">
                    <Trophy className="h-4 w-4 text-yellow-400 mr-2 animate-float" />
                    Achievements
                  </h3>
                  {achievements.length > 0 ? (
                    <div className="space-y-2">
                      {achievements.map((achievement, index) => (
                        <div
                          key={index}
                          className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 rounded-lg px-2 py-1 text-xs text-yellow-300 animate-pulse hover:scale-105 transition-transform duration-300"
                        >
                          🏆 {achievement}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-xs italic">
                      Complete your profile to earn achievements!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Career Insights Panel */}
      <CareerInsightsPanel 
        formData={formData} 
        cvScore={cvScore} 
      />

      {/* Enhanced Radar Chart */}
      <Card className="bg-gradient-to-br from-slate-900/50 to-blue-900/30 backdrop-blur-md border-blue-400/20 shadow-2xl animate-slide-in-up stagger-2">
        <CardContent className="p-6 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 flex items-center justify-center">
              <Target className="h-6 w-6 sm:h-7 sm:w-7 text-blue-400 mr-3 animate-float" />
              Profile Performance Radar
            </h2>
            <p className="text-gray-300 text-base sm:text-lg">Your comprehensive profile strength across key professional areas</p>
          </div>
          
          {/* Chart Container with better proportions */}
          <div className="h-80 sm:h-96 w-full max-w-4xl mx-auto">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart 
                data={generateRadarData()} 
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                {/* Enhanced Polar Grid */}
                <PolarGrid 
                  stroke="#4B5563" 
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                
                {/* Enhanced Angle Axis */}
                <PolarAngleAxis 
                  dataKey="metric" 
                  tick={{ 
                    fill: '#E5E7EB', 
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: 'Inter, system-ui, sans-serif'
                  }}
                  tickLine={false}
                />
                
                {/* Enhanced Radius Axis */}
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]} 
                  tick={{ 
                    fill: '#9CA3AF', 
                    fontSize: 10,
                    fontFamily: 'Inter, system-ui, sans-serif'
                  }}
                  tickLine={false}
                  axisLine={false}
                  tickCount={6}
                />
                
                {/* Enhanced Radar with gradient fill */}
                <Radar
                  name="Your Score"
                  dataKey="value"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  fill="url(#radarGradient)"
                  fillOpacity={0.4}
                  dot={{ 
                    fill: '#3B82F6', 
                    strokeWidth: 2, 
                    r: 4,
                    stroke: '#FFFFFF'
                  }}
                />
                
                {/* Custom Tooltip */}
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-800 border border-blue-400/30 rounded-lg p-3 shadow-xl backdrop-blur-sm">
                          <p className="text-white font-semibold text-sm">{label}</p>
                          <p className="text-blue-400 font-bold text-lg">{data.value}/100</p>
                          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${data.value}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                
                {/* Gradient definition for the radar fill */}
                <defs>
                  <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
              </RadarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Metrics Legend */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
            {generateRadarData().map((item, index) => (
              <div key={index} className="flex flex-col items-center p-3 bg-white/5 rounded-lg border border-white/10 hover:border-blue-400/30 transition-all duration-300">
                <div className="w-3 h-3 rounded-full mb-2" style={{ backgroundColor: item.color }}></div>
                <span className="text-xs sm:text-sm text-gray-300 font-medium text-center">{item.metric}</span>
                <span className="text-lg font-bold text-white">{item.value}</span>
                <span className="text-xs text-gray-400">/100</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strengths & Areas to Improve */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Strengths */}
        <Card className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 backdrop-blur-md border-green-400/20 shadow-2xl animate-slide-in-left stagger-3">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center mb-3 sm:mb-4">
              <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-green-400 mr-2 sm:mr-3 animate-float" />
              <h3 className="text-lg sm:text-xl font-semibold text-white">Your Strengths</h3>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {getNumericalCVScore >= 80 && (
                <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-2 sm:p-3 animate-pulse hover:scale-105 transition-transform duration-300">
                  <div className="text-green-300 text-xs sm:text-sm font-medium">🎯 CV Excellence</div>
                  <div className="text-green-200 text-xs">Your CV is performing exceptionally well!</div>
                </div>
              )}
              {formData.gpa && parseFloat(formData.gpa) >= 3.8 && (
                <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-2 sm:p-3 animate-pulse hover:scale-105 transition-transform duration-300">
                  <div className="text-green-300 text-xs sm:text-sm font-medium">📚 Academic Star</div>
                  <div className="text-green-200 text-xs">Outstanding academic performance</div>
                </div>
              )}
              {formData.interests && formData.interests.split(',').length >= 3 && (
                <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-2 sm:p-3 animate-pulse hover:scale-105 transition-transform duration-300">
                  <div className="text-green-300 text-xs sm:text-sm font-medium">🌟 Diverse Interests</div>
                  <div className="text-green-200 text-xs">You have a well-rounded skill set</div>
                </div>
              )}
              {(getNumericalCVScore < 80) && (!formData.gpa || parseFloat(formData.gpa) < 3.8) && (!formData.interests || formData.interests.split(',').length < 3) && (
                <div className="text-gray-400 text-xs sm:text-sm italic">
                  Complete your profile to discover your strengths!
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Areas to Improve */}
        <Card className="bg-gradient-to-br from-orange-900/30 to-red-900/30 backdrop-blur-md border-orange-400/20 shadow-2xl animate-slide-in-right stagger-3">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center mb-3 sm:mb-4">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-orange-400 mr-2 sm:mr-3 animate-float" />
              <h3 className="text-lg sm:text-xl font-semibold text-white">Areas to Improve</h3>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {getNumericalCVScore < 60 && (
                <div className="bg-orange-500/20 border border-orange-400/30 rounded-lg p-2 sm:p-3 animate-pulse hover:scale-105 transition-transform duration-300">
                  <div className="text-orange-300 text-xs sm:text-sm font-medium">📝 CV Enhancement</div>
                  <div className="text-orange-200 text-xs">Consider improving your CV content and structure</div>
                </div>
              )}
              {(!formData.bio || formData.bio.length < 50) && (
                <div className="bg-orange-500/20 border border-orange-400/30 rounded-lg p-2 sm:p-3 animate-pulse hover:scale-105 transition-transform duration-300">
                  <div className="text-orange-300 text-xs sm:text-sm font-medium">💬 Personal Brand</div>
                  <div className="text-orange-200 text-xs">Add a compelling bio to showcase your personality</div>
                </div>
              )}
              {(!formData.portfolioLinks || formData.portfolioLinks.trim() === '') && (
                <div className="bg-orange-500/20 border border-orange-400/30 rounded-lg p-2 sm:p-3 animate-pulse hover:scale-105 transition-transform duration-300">
                  <div className="text-orange-300 text-xs sm:text-sm font-medium">🔗 Portfolio Links</div>
                  <div className="text-orange-200 text-xs">Add portfolio, LinkedIn, or GitHub links</div>
                </div>
              )}
              {getNumericalCVScore >= 60 && formData.bio && formData.bio.length >= 50 && formData.portfolioLinks && formData.portfolioLinks.trim() !== '' && (
                <div className="text-green-400 text-xs sm:text-sm font-medium animate-pulse">
                  🎉 Great job! Keep maintaining your profile!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 animate-slide-in-up stagger-4">
        <Button
          onClick={onEditProfile}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center hover:animate-glow"
        >
          <Edit3 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
          Edit Profile
        </Button>
        {formData.uploadedCVName && (
          <Button
            onClick={onViewCV}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center hover:animate-glow"
          >
            <Eye className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            View CV
          </Button>
        )}
      </div>
    </div>
  );
}

'use client';

/**
 * Student Privacy Settings Component
 * 
 * Allows students to control their visibility to recruiters and
 * manage their privacy preferences for the recruiter platform.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Mail, 
  MailX, 
  Users, 
  UserCheck,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

interface PrivacySettings {
  isProfilePublic: boolean;
  allowRecruiterContact: boolean;
  showCVScore: boolean;
  showAchievements: boolean;
  showContactInfo: boolean;
}

export default function StudentPrivacySettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings>({
    isProfilePublic: true,
    allowRecruiterContact: true,
    showCVScore: true,
    showAchievements: true,
    showContactInfo: false,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Load current privacy settings
  useEffect(() => {
    if (!user) return;
    
    const loadSettings = async () => {
      try {
        setLoading(true);
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setSettings({
            isProfilePublic: userData.isProfilePublic !== false,
            allowRecruiterContact: userData.allowRecruiterContact !== false,
            showCVScore: userData.showCVScore !== false,
            showAchievements: userData.showAchievements !== false,
            showContactInfo: userData.showContactInfo === true,
          });
        }
      } catch (err: any) {
        setError('Failed to load privacy settings');
        console.error('Error loading privacy settings:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, [user]);
  
  const handleSettingChange = (setting: keyof PrivacySettings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };
  
  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    setError('');
    setSuccess(false);
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...settings,
        privacyUpdatedAt: new Date()
      });
      
      setSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err: any) {
      setError('Failed to save privacy settings: ' + err.message);
      console.error('Error saving privacy settings:', err);
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-400 mr-2" />
            <span className="text-gray-300">Loading privacy settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Recruiter Privacy Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Visibility */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {settings.isProfilePublic ? (
                <Eye className="h-5 w-5 text-green-400" />
              ) : (
                <EyeOff className="h-5 w-5 text-red-400" />
              )}
              <div>
                <h3 className="text-white font-medium">Profile Visibility</h3>
                <p className="text-gray-400 text-sm">
                  Allow recruiters to see your profile in search results
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSettingChange('isProfilePublic', !settings.isProfilePublic)}
              className={`border-white/20 ${
                settings.isProfilePublic
                  ? 'bg-green-500/20 text-green-300 border-green-500/50'
                  : 'bg-red-500/20 text-red-300 border-red-500/50'
              }`}
            >
              {settings.isProfilePublic ? 'Visible' : 'Hidden'}
            </Button>
          </div>
          
          {!settings.isProfilePublic && (
            <div className="flex items-start space-x-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
              <p className="text-yellow-300 text-sm">
                Your profile will not appear in recruiter searches. You can still use all other Gradual features.
              </p>
            </div>
          )}
        </div>
        
        {/* Recruiter Contact */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {settings.allowRecruiterContact ? (
                <Mail className="h-5 w-5 text-green-400" />
              ) : (
                <MailX className="h-5 w-5 text-red-400" />
              )}
              <div>
                <h3 className="text-white font-medium">Recruiter Contact</h3>
                <p className="text-gray-400 text-sm">
                  Allow recruiters to send you messages and opportunities
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSettingChange('allowRecruiterContact', !settings.allowRecruiterContact)}
              className={`border-white/20 ${
                settings.allowRecruiterContact
                  ? 'bg-green-500/20 text-green-300 border-green-500/50'
                  : 'bg-red-500/20 text-red-300 border-red-500/50'
              }`}
            >
              {settings.allowRecruiterContact ? 'Allowed' : 'Blocked'}
            </Button>
          </div>
          
          {!settings.allowRecruiterContact && (
            <div className="flex items-start space-x-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-blue-300 text-sm">
                Recruiters won&apos;t be able to contact you directly, but they can still view your profile if it&apos;s public.
              </p>
            </div>
          )}
        </div>
        
        {/* CV Score Visibility */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {settings.showCVScore ? (
                <UserCheck className="h-5 w-5 text-green-400" />
              ) : (
                <UserCheck className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <h3 className="text-white font-medium">CV Score</h3>
                <p className="text-gray-400 text-sm">
                  Show your CV score to recruiters
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSettingChange('showCVScore', !settings.showCVScore)}
              className={`border-white/20 ${
                settings.showCVScore
                  ? 'bg-green-500/20 text-green-300 border-green-500/50'
                  : 'bg-gray-500/20 text-gray-300 border-gray-500/50'
              }`}
            >
              {settings.showCVScore ? 'Visible' : 'Hidden'}
            </Button>
          </div>
        </div>
        
        {/* Achievements Visibility */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {settings.showAchievements ? (
                <Users className="h-5 w-5 text-green-400" />
              ) : (
                <Users className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <h3 className="text-white font-medium">Achievements</h3>
                <p className="text-gray-400 text-sm">
                  Show your achievements and gamification progress
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSettingChange('showAchievements', !settings.showAchievements)}
              className={`border-white/20 ${
                settings.showAchievements
                  ? 'bg-green-500/20 text-green-300 border-green-500/50'
                  : 'bg-gray-500/20 text-gray-300 border-gray-500/50'
              }`}
            >
              {settings.showAchievements ? 'Visible' : 'Hidden'}
            </Button>
          </div>
        </div>
        
        {/* Contact Information */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {settings.showContactInfo ? (
                <Mail className="h-5 w-5 text-green-400" />
              ) : (
                <Mail className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <h3 className="text-white font-medium">Contact Information</h3>
                <p className="text-gray-400 text-sm">
                  Show your email address to recruiters
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSettingChange('showContactInfo', !settings.showContactInfo)}
              className={`border-white/20 ${
                settings.showContactInfo
                  ? 'bg-green-500/20 text-green-300 border-green-500/50'
                  : 'bg-gray-500/20 text-gray-300 border-gray-500/50'
              }`}
            >
              {settings.showContactInfo ? 'Visible' : 'Hidden'}
            </Button>
          </div>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}
        
        {/* Success Message */}
        {success && (
          <div className="flex items-center space-x-2 p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <p className="text-green-300 text-sm">Privacy settings saved successfully!</p>
          </div>
        )}
        
        {/* Save Button */}
        <div className="pt-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Privacy Settings
              </>
            )}
          </Button>
        </div>
        
        {/* Help Text */}
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            These settings control how recruiters can see and interact with your profile.
            You can change them anytime.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}


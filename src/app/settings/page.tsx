'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ChevronDown, ChevronUp, Settings, Database, Info } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [cvScoreCache, setCvScoreCache] = useState<Map<string, any>>(new Map());
  const [collapsed, setCollapsed] = useState({
    cache: false,
    scoring: false,
    system: false
  });

  useEffect(() => {
    if (user) {
      // Load cache from localStorage
      const cached = localStorage.getItem('cvScoreCache');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const map = new Map(Object.entries(parsed));
          setCvScoreCache(map);
        } catch (error) {
          console.error('Error parsing cache:', error);
        }
      }
    }
  }, [user]);

  const clearCache = () => {
    localStorage.removeItem('cvScoreCache');
    setCvScoreCache(new Map());
  };

  const getCVHashPreview = (cvText: string) => {
    if (!cvText) return 'No CV text';
    const normalized = cvText.trim().toLowerCase();
    const words = normalized.split(/\s+/);
    const preview = words.slice(0, 10).join(' ');
    return `${preview}${words.length > 10 ? '...' : ''} (${words.length} words)`;
  };

  const toggleSection = (section: keyof typeof collapsed) => {
    setCollapsed(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-600">Please log in to access settings.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl mt-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-3">Settings</h1>
        <p className="text-gray-300 text-lg">Manage your account settings and view system information</p>
      </div>

      {/* CV Scoring Configuration */}
      <Card className="mb-8 bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
        <CardHeader 
          className="cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10 p-6"
          onClick={() => toggleSection('scoring')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-6 w-6 text-blue-400" />
              <CardTitle className="text-white text-xl">CV Scoring Configuration</CardTitle>
            </div>
            {collapsed.scoring ? <ChevronDown className="h-5 w-5 text-gray-300" /> : <ChevronUp className="h-5 w-5 text-gray-300" />}
          </div>
        </CardHeader>
        {!collapsed.scoring && (
          <CardContent className="bg-white/5 p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/10 p-5 rounded-lg border border-white/20">
                  <h4 className="font-semibold text-white mb-3 text-lg">Word Count Limits</h4>
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li>• Minimum: 10 words</li>
                    <li>• Maximum: 1,500 words</li>
                    <li>• Optimal: 300-600 words</li>
                  </ul>
                </div>
                <div className="bg-white/10 p-5 rounded-lg border border-white/20">
                  <h4 className="font-semibold text-white mb-3 text-lg">Scoring Ranges</h4>
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li>• &lt;50 words: 0-5 points</li>
                    <li>• 50-99 words: 5-10 points</li>
                    <li>• 100-299 words: 10-50 points</li>
                    <li>• 300+ words: 30-90 points</li>
                  </ul>
                </div>
              </div>
              <div className="bg-blue-500/20 p-5 rounded-lg border border-blue-400/30">
                <h4 className="font-semibold text-blue-300 mb-3 text-lg">Quality Gates</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-blue-200">
                  <div>
                    <strong>Professional Indicators:</strong> Requires 4+ professional terms
                  </div>
                  <div>
                    <strong>Structure Elements:</strong> Requires 3+ structural components
                  </div>
                  <div>
                    <strong>Content Validation:</strong> Checks for inappropriate content
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Cache Management */}
      <Card className="mb-8 bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
        <CardHeader 
          className="cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10 p-6"
          onClick={() => toggleSection('cache')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="h-6 w-6 text-green-400" />
              <CardTitle className="text-white text-xl">CV Score Cache</CardTitle>
            </div>
            {collapsed.cache ? <ChevronDown className="h-5 w-5 text-gray-300" /> : <ChevronUp className="h-5 w-5 text-gray-300" />}
          </div>
        </CardHeader>
        {!collapsed.cache && (
          <CardContent className="bg-white/5 p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300 mb-1">
                    Cached CV scores: <span className="font-semibold text-white text-lg">{cvScoreCache.size}</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    Caching prevents duplicate API calls for identical CVs
                  </p>
                </div>
                <Button onClick={clearCache} variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10 px-4 py-2">
                  Clear Cache
                </Button>
              </div>
              
              {cvScoreCache.size > 0 && (
                <div className="bg-white/10 p-5 rounded-lg border border-white/20">
                  <h4 className="font-semibold text-white mb-4 text-lg">Recent Cache Entries</h4>
                  <div className="space-y-4 max-h-60 overflow-y-auto">
                    {Array.from(cvScoreCache.entries()).slice(0, 5).map(([hash, data], index) => (
                      <div key={index} className="border-l-4 border-green-400 pl-4 py-2">
                        <div className="text-xs text-gray-400 font-mono mb-2">
                          Hash: {hash.substring(0, 16)}...
                        </div>
                        <div className="text-sm text-gray-200 mb-1">
                          Preview: {getCVHashPreview(data.cvText || 'No text available')}
                        </div>
                        <div className="text-xs text-gray-400">
                          Cached: {new Date(data.timestamp || Date.now()).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* System Status */}
      <Card className="mb-8 bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
        <CardHeader 
          className="cursor-pointer hover:bg-white/10 transition-colors border-b border-white/10 p-6"
          onClick={() => toggleSection('system')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Info className="h-6 w-6 text-purple-400" />
              <CardTitle className="text-white text-xl">System Status</CardTitle>
            </div>
            {collapsed.system ? <ChevronDown className="h-5 w-5 text-gray-300" /> : <ChevronUp className="h-5 w-5 text-gray-300" />}
          </div>
        </CardHeader>
        {!collapsed.system && (
          <CardContent className="bg-white/5 p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-500/20 p-5 rounded-lg border border-green-400/30 text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">✓</div>
                  <div className="text-sm font-semibold text-green-300 mb-1">Authentication</div>
                  <div className="text-xs text-green-200">Active</div>
                </div>
                <div className="bg-green-500/20 p-5 rounded-lg border border-green-400/30 text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">✓</div>
                  <div className="text-sm font-semibold text-green-300 mb-1">CV Scoring</div>
                  <div className="text-xs text-green-200">Operational</div>
                </div>
                <div className="bg-green-500/20 p-5 rounded-lg border border-green-400/30 text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">✓</div>
                  <div className="text-sm font-semibold text-green-300 mb-1">Cache System</div>
                  <div className="text-xs text-green-200">Active</div>
                </div>
              </div>
              
              <div className="bg-white/10 p-5 rounded-lg border border-white/20">
                <h4 className="font-semibold text-white mb-3 text-lg">Recent Updates</h4>
                <ul className="text-sm text-gray-300 space-y-2">
                  <li>• Implemented stricter CV scoring algorithm</li>
                  <li>• Added quality gates for professional content</li>
                  <li>• Enhanced structure validation</li>
                  <li>• Improved cache management</li>
                </ul>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

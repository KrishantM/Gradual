'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function FixRolePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const fixRole = async (role: 'student' | 'recruiter') => {
    if (!user) return;
    
    setLoading(true);
    setResult('');
    
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/fix-user-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newRole: role })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ Success: ${data.message}`);
        // Reload the page to trigger role detection
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      } else {
        setResult(`❌ Error: ${data.error}`);
      }
    } catch (error: any) {
      setResult(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <p className="text-white text-center">Please log in first</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-white text-center">Fix User Role</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-300 text-center">
            Current user: <strong>{user.email}</strong>
          </p>
          
          <div className="space-y-2">
            <Button
              onClick={() => fixRole('recruiter')}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Fixing...' : 'Set as Recruiter'}
            </Button>
            
            <Button
              onClick={() => fixRole('student')}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Fixing...' : 'Set as Student'}
            </Button>
          </div>
          
          {result && (
            <div className="p-3 bg-white/10 rounded-lg">
              <p className="text-white text-sm">{result}</p>
            </div>
          )}
          
          <p className="text-gray-400 text-xs text-center">
            This will update your role in the database and redirect you to the appropriate dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}










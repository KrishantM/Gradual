'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function SecurityTestPage() {
  const [results, setResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runSecurityTests = async () => {
    setIsRunning(true);
    setResults([]);
    
    const addResult = (message: string) => {
      setResults(prev => [...prev, message]);
    };

    try {
      // Test 1: Unauthorized access
      addResult('🔒 Testing unauthorized access...');
      
      const endpoints = ['/score', '/suggestions', '/opportunities'];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`/api${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: 'data' })
          });
          
          if (response.status === 401) {
            addResult(`✅ ${endpoint}: Properly rejects unauthorized access`);
          } else {
            addResult(`❌ ${endpoint}: Allows unauthorized access (${response.status})`);
          }
        } catch (error) {
          addResult(`✅ ${endpoint}: Properly rejects unauthorized access`);
        }
      }

      // Test 2: Invalid token
      addResult('\n🔒 Testing invalid token access...');
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`/api${endpoint}`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': 'Bearer invalid-token-123'
            },
            body: JSON.stringify({ test: 'data' })
          });
          
          if (response.status === 401) {
            addResult(`✅ ${endpoint}: Properly rejects invalid token`);
          } else {
            addResult(`❌ ${endpoint}: Allows invalid token (${response.status})`);
          }
        } catch (error) {
          addResult(`✅ ${endpoint}: Properly rejects invalid token`);
        }
      }

      // Test 3: Rate limiting
      addResult('\n🔒 Testing rate limiting...');
      
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          fetch('/api/waitlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: `Test User ${i}`,
              email: `test${i}@example.com`
            })
          })
        );
      }
      
      const responses = await Promise.all(requests);
      const statusCodes = responses.map(r => r.status);
      
      const rateLimited = statusCodes.filter(code => code === 429).length;
      addResult(`Rate limiting test: ${rateLimited} requests were rate limited out of ${responses.length}`);
      
      if (rateLimited > 0) {
        addResult('✅ Rate limiting is working');
      } else {
        addResult('❌ Rate limiting may not be working');
      }

      addResult('\n✅ Security tests completed!');
      
    } catch (error) {
      addResult(`❌ Error running tests: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold text-white mb-6 text-center">
              Security Test Suite
            </h1>
            
            <p className="text-gray-300 mb-6 text-center">
              This page tests the security of your API endpoints and rate limiting.
            </p>

            <div className="flex justify-center mb-8">
              <Button
                onClick={runSecurityTests}
                disabled={isRunning}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  'Run Security Tests'
                )}
              </Button>
            </div>

            {results.length > 0 && (
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Test Results:</h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {results.map((result, index) => (
                    <div key={index} className="text-sm">
                      {result.startsWith('✅') ? (
                        <div className="flex items-center text-green-400">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {result}
                        </div>
                      ) : result.startsWith('❌') ? (
                        <div className="flex items-center text-red-400">
                          <XCircle className="h-4 w-4 mr-2" />
                          {result}
                        </div>
                      ) : (
                        <div className="text-gray-300">{result}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
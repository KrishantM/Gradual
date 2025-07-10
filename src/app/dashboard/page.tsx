'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import ToDoList from '@/components/ToDoList';

function extractOverallScore(scoreText: string | null): string | null {
  if (!scoreText) return null;
  const match = scoreText.match(/Overall Score \(0–100\):\s*(\d+)/);
  return match ? match[1] : null;
}

function formatDate(date: any) {
  if (!date) return '';
  if (typeof date === 'string') date = new Date(date);
  if (date.toDate) date = date.toDate(); // Firestore Timestamp
  return date.toLocaleDateString();
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [suggestions, setSuggestions] = useState('');
  const [name, setName] = useState('');
  const [cvScore, setCvScore] = useState<string | null>(null);
  const [cvScoreTimestamp, setCvScoreTimestamp] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setName(userSnap.data().fullName || '');
          setCvScore(userSnap.data().cvScore || null);
          setCvScoreTimestamp(userSnap.data().cvScoreTimestamp || null);
        }

        const suggRef = doc(db, 'suggestions', user.uid);
        const suggSnap = await getDoc(suggRef);
        if (suggSnap.exists()) {
          setSuggestions(suggSnap.data().suggestions);
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, router]);

  const overallScore = extractOverallScore(cvScore);

  if (loading || !user) return <p className="text-center mt-6 text-white">Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 mt-8 bg-white rounded shadow text-black space-y-8">
      <h1 className="text-3xl font-bold">Welcome{name && `, ${name}`}!</h1>

      {/* CV Score Section */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Your Latest CV Score</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col items-start">
          <div className="flex items-center gap-4">
            <span className="text-5xl font-extrabold text-blue-700">{overallScore ? overallScore : '—'}</span>
            <button
              className="ml-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
              onClick={() => setShowDetails((v) => !v)}
              aria-expanded={showDetails}
            >
              {showDetails ? 'Hide Details' : 'View Details'}
            </button>
          </div>
          {cvScoreTimestamp && (
            <span className="text-xs text-gray-400 mt-1">Last updated: {formatDate(cvScoreTimestamp)}</span>
          )}
          {showDetails && cvScore && (
            <div className="mt-4 w-full text-sm text-gray-800 bg-white border border-blue-100 rounded p-3 whitespace-pre-line" style={{ fontSize: '0.95rem', lineHeight: '1.4' }}>
              {cvScore}
            </div>
          )}
        </div>
      </div>

      {/* Saved Suggestions */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Saved Suggestions</h2>
        {suggestions ? (
          <div className="bg-gray-100 p-4 rounded whitespace-pre-wrap">
            {suggestions}
          </div>
        ) : (
          <p className="text-gray-600">
            No saved suggestions yet. Generate some{' '}
            <Link href="/suggestions" className="text-blue-600 underline">
              here
            </Link>.
          </p>
        )}
      </div>

      {/* To-Do List */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Your Career To-Do List</h2>
        <ToDoList userId={user.uid} />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <Link href="/profile" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Edit Profile
        </Link>
        <Link href="/suggestions" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Get New Suggestions
        </Link>
        <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
          Logout
        </button>
      </div>
    </div>
  );
}

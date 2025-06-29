'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '../../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Link from 'next/link';

export default function SuggestionsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [extraContext, setExtraContext] = useState('');
  const [profile, setProfile] = useState<any>(null);

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

  const handleGenerate = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          interests: `${profile.interests} ${extraContext}`,
          uid: user?.uid,
        }),
      });
      const data = await res.json();
      setSuggestions(data.suggestions);
    } catch (err) {
      alert('Failed to generate suggestions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-black rounded-lg mt-10 text-white">
      <h1 className="text-3xl font-bold text-center mb-6">Career Suggestions</h1>

      {profile && (
        <div className="bg-white text-gray-800 rounded p-4 shadow mb-6">
          <p className="font-bold mb-1 text-gray-900">Your Profile Summary</p>
          <p><strong>Name:</strong> {profile.fullName}</p>
          <p><strong>University:</strong> {profile.university}</p>
          <p><strong>Degree:</strong> {profile.degree}</p>
          <p><strong>GPA:</strong> {profile.gpa}</p>
          <p><strong>Interests:</strong> {profile.interests}</p>
        </div>
      )}

      <div className="mb-4">
        <p className="text-green-400 text-sm mb-1">✅ Suggestions are based on your profile.</p>
        <p className="text-orange-300 text-sm mb-2">✏️ Add extra context below for more specific results.</p>
        <textarea
          className="w-full p-3 rounded bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring focus:border-blue-500"
          rows={4}
          placeholder="e.g. Interested in data roles with social impact…"
          value={extraContext}
          onChange={(e) => setExtraContext(e.target.value)}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full sm:w-auto"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Suggestions'}
        </button>

        <Link
          href="/dashboard"
          className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded text-center w-full sm:w-auto"
        >
          View Saved Suggestions →
        </Link>
      </div>

      {suggestions.length > 0 && (
        <div className="mt-8 bg-gray-900 p-4 rounded">
          <h2 className="text-xl font-semibold mb-4 text-white">Suggestions:</h2>
          <ul className="space-y-4 text-white">
            {suggestions.map((sug, i) => (
              <li key={i} className="bg-gray-800 p-3 rounded border border-gray-700 whitespace-pre-wrap">
                {sug}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

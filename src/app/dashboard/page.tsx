'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [suggestions, setSuggestions] = useState('');
  const [name, setName] = useState('');
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
  }, [user]);

  if (loading) return <p className="text-center mt-6 text-white">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 mt-8 bg-white rounded shadow text-black">
      <h1 className="text-3xl font-bold mb-4">Welcome{ name && `, ${name}` }!</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Saved Suggestions</h2>
        {suggestions ? (
          <div className="bg-gray-100 p-4 rounded whitespace-pre-wrap">
            {suggestions}
          </div>
        ) : (
          <p className="text-gray-600">No saved suggestions yet. Generate some <Link href="/suggestions" className="text-blue-600 underline">here</Link>.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        <Link href="/profile" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Edit Profile</Link>
        <Link href="/suggestions" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Get New Suggestions</Link>
        <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Logout</button>
      </div>
    </div>
  );
}

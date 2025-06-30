'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '../../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth(); // updated

  const [formData, setFormData] = useState({
    fullName: '',
    university: '',
    degree: '',
    gpa: '',
    interests: '',
    cvLink: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return; // wait for Firebase Auth to load

    if (!user) {
      router.push('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setFormData(prev => ({ ...prev, ...snap.data() }));
        }
      } catch (err) {
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, authLoading, router]);

  const handleChange = (e: any) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        { ...formData, updatedAt: new Date() },
        { merge: true }
      );
      alert('Profile saved!');
    } catch (err) {
      setError('Failed to save profile.');
    }
  };

  if (authLoading) {
    return <p className="text-center text-gray-600 mt-8">Authenticating...</p>;
  }

  if (!user) return null;

  return (
    <div className="max-w-xl mx-auto p-6 bg-gray-50 shadow rounded mt-8">
      <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">Your Profile</h1>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      {loading ? (
        <p className="text-center text-gray-700">Loading...</p>
      ) : (
        <>
          <label className="block mb-2 font-semibold text-gray-800">Full Name</label>
          <input
            className="w-full p-2 border mb-4 rounded text-black"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
          />

          <label className="block mb-2 font-semibold text-gray-800">University</label>
          <input
            className="w-full p-2 border mb-4 rounded text-black"
            name="university"
            value={formData.university}
            onChange={handleChange}
          />

          <label className="block mb-2 font-semibold text-gray-800">Degree / Major</label>
          <input
            className="w-full p-2 border mb-4 rounded text-black"
            name="degree"
            value={formData.degree}
            onChange={handleChange}
          />

          <label className="block mb-2 font-semibold text-gray-800">GPA</label>
          <input
            className="w-full p-2 border mb-4 rounded text-black"
            name="gpa"
            value={formData.gpa}
            onChange={handleChange}
          />

          <label className="block mb-2 font-semibold text-gray-800">Interests / Passions</label>
          <textarea
            className="w-full p-2 border mb-4 rounded text-black"
            name="interests"
            value={formData.interests}
            onChange={handleChange}
          />

          <label className="block mb-2 font-semibold text-gray-800">CV Link (optional)</label>
          <input
            className="w-full p-2 border mb-4 rounded text-black"
            name="cvLink"
            value={formData.cvLink}
            onChange={handleChange}
          />

          <button
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            onClick={handleSave}
          >
            Save Profile
          </button>
        </>
      )}
    </div>
  );
}

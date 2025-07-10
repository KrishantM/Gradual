'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { db } from '../../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    university: '',
    degree: '',
    gpa: '',
    interests: '',
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
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
      const { ...dataWithoutFile } = formData;
      await setDoc(
        doc(db, 'users', user.uid),
        {
          ...dataWithoutFile,
          updatedAt: new Date(),
          uploadedCVName: cvFile?.name || null,
        },
        { merge: true }
      );
      alert('Profile saved!');
    } catch (err) {
      setError('Failed to save profile.');
    }
  };

  if (authLoading) return <p className="text-center text-gray-600 mt-8">Authenticating...</p>;
  if (!user) return null;

  return (
    <div className="max-w-xl mx-auto p-6 bg-gray-50 shadow rounded mt-8">
      <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">Your Profile</h1>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      {loading ? (
        <p className="text-center text-gray-700">Loading...</p>
      ) : (
        <>
          {['fullName', 'university', 'degree', 'gpa', 'interests'].map((field) => (
            <div key={field} className="mb-4">
              <label className="block mb-2 font-semibold text-gray-800">
                {field === 'gpa' ? 'GPA' : field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
              </label>
              {field === 'interests' ? (
                <textarea
                  className="w-full p-2 border rounded text-black"
                  name={field}
                  value={formData[field as keyof typeof formData]}
                  onChange={handleChange}
                />
              ) : (
                <input
                  className="w-full p-2 border rounded text-black"
                  name={field}
                  value={formData[field as keyof typeof formData]}
                  onChange={handleChange}
                />
              )}
            </div>
          ))}

          <label className="block mb-2 font-semibold text-gray-800">Upload CV (PDF only)</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setCvFile(e.target.files?.[0] || null)}
            className="mb-4 text-gray-600"
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

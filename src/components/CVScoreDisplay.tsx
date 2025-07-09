'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface CVScoreDisplayProps {
  userId: string;
}

export default function CVScoreDisplay({ userId }: CVScoreDisplayProps) {
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    const fetchScore = async () => {
      const docRef = doc(db, 'cvScores', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setScore(docSnap.data().score || null);
      }
    };
    fetchScore();
  }, [userId]);

  return (
    <div className="bg-gray-100 p-4 rounded text-center">
      {score !== null ? (
        <p className="text-2xl font-bold text-blue-700">
          {score} / 100
        </p>
      ) : (
        <p className="text-gray-500">No score available yet.</p>
      )}
    </div>
  );
}

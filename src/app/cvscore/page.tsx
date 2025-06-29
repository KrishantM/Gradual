'use client';

import Head from 'next/head';
import { useState } from 'react';

export default function Home() {
  const [cvText, setCvText] = useState('');
  const [score, setScore] = useState('');

  const handleSubmit = async () => {
    const res = await fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cvText }),
    });

    const data = await res.json();
    setScore(data.score);
  };

  return (
    <div className="min-h-screen p-8 bg-white">
      <Head>
        <title>neXtwork</title>
      </Head>
      <main className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">neXtwork CV Scorer</h1>
        <textarea
          className="w-full h-60 border border-gray-300 p-4 text-base font-medium rounded-md shadow-sm text-black bg-white resize-y"
          value={cvText}
          onChange={(e) => setCvText(e.target.value)}
          placeholder="Paste your CV text here..."
        />
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition duration-200 mx-auto block"
          onClick={handleSubmit}
        >
          Submit CV
        </button>
        {score && (
  <div className="mt-6 text-lg text-gray-800 bg-gray-100 p-4 rounded shadow-md text-left whitespace-pre-line">
    <strong className="text-blue-600">AI Evaluation:</strong><br />
    {score}
  </div>
)}
      </main>
    </div>
  );
}

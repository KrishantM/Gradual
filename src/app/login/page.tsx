'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();

  // 🚫 Prevent already logged-in users from accessing this page
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      await login(email, password);
    } catch (err: any) {
      setError('Login failed: ' + err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow rounded mt-10 text-black">
      <h1 className="text-2xl font-bold mb-4 text-center">Login to neXtwork</h1>
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <input
        className="w-full p-2 border mb-4 rounded"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="w-full p-2 border mb-4 rounded"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        onClick={handleLogin}
      >
        Login
      </button>
    </div>
  );
}

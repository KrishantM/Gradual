'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow p-4 flex justify-between items-center">
      <Link href="/dashboard" className="text-xl font-bold text-blue-600">neXtwork</Link>
      <div className="space-x-4">
        {user ? (
          <>
            <Link href="/cvscore" className="text-gray-700 hover:text-blue-600">CV Score</Link>
            <Link href="/suggestions" className="text-gray-700 hover:text-blue-600">Suggestions</Link>
            <Link href="/profile" className="text-gray-700 hover:text-blue-600">Profile</Link>
            <button onClick={logout} className="text-red-600 hover:underline">Logout</button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-blue-600 hover:underline">Login</Link>
            <Link href="/register" className="text-blue-600 hover:underline">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}



'use client';

import { useState } from 'react';
import { auth, db } from '../../../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const router = useRouter();

  const validatePassword = (password: string) => {
    const lengthOK = password.length >= 6;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    return lengthOK && hasUppercase && hasLowercase && hasNumber;
  };

  const handleRegister = async () => {
    setError('');

    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!validatePassword(password)) {
      setError(
        'Password must be at least 6 characters and include uppercase, lowercase, and a number.'
      );
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      await setDoc(doc(db, 'users', uid), {
        email,
        role,
        createdAt: new Date(),
      });

      alert('Registration successful!');
      router.push('/login');
    } catch (err: any) {
      setError(`Firebase: ${err.message}`);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow rounded mt-10 text-gray-900">
      <h1 className="text-2xl font-bold mb-4 text-center text-gray-900">Register for neXtwork</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}

      <label className="block text-sm font-medium mb-1">Email</label>
      <input
        className="w-full p-2 border mb-4 rounded text-black"
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label className="block text-sm font-medium mb-1">Password</label>
      <input
        className="w-full p-2 border mb-4 rounded text-black"
        type="password"
        placeholder="Enter a password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <label className="block text-sm font-medium mb-1">Role</label>
      <select
        className="w-full p-2 border mb-4 rounded text-black"
        value={role}
        onChange={(e) => setRole(e.target.value)}
      >
        <option value="student">Student</option>
        <option value="recruiter">Recruiter</option>
      </select>

      <button
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        onClick={handleRegister}
      >
        Register
      </button>
    </div>
  );
}

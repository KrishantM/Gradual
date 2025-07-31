import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';

const inter = Inter({ 
  variable: '--font-inter', 
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Gradual - AI-Powered Career Platform',
  description: 'Get AI-powered CV scoring and personalized career suggestions to accelerate your professional growth.',
  keywords: 'AI, career, CV scoring, job suggestions, career platform, Gradual',
  authors: [{ name: 'Gradual Team' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <AuthProvider>
          <Navbar />
          <main className="pt-16">
            {children}
          </main>
          <footer className="w-full py-4 text-center text-gray-500 text-sm flex flex-col items-center gap-1">
            <span>© 2025 Gradual. All rights reserved.</span>
            <span className="space-x-4">
              <a href="/terms" className="underline hover:text-blue-400 transition-colors">Terms of Service</a>
              <span>|</span>
              <a href="/privacy" className="underline hover:text-blue-400 transition-colors">Privacy Policy</a>
            </span>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}

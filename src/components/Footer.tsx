'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-slate-900/50 backdrop-blur-md border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Left side - Brand */}
          <div className="flex items-center">
            <Image
              src="/newlogo2.png"
              alt="Gradual Logo"
              width={150}
              height={45}
              className="h-8 w-auto"
              priority
              quality={100}
            />
          </div>

          {/* Center - Links */}
          <div className="flex items-center space-x-6">
            <Link 
              href="/terms" 
              className="text-gray-400 hover:text-blue-400 transition-colors duration-200 text-sm"
            >
              Terms of Service
            </Link>
            <Link 
              href="/privacy" 
              className="text-gray-400 hover:text-blue-400 transition-colors duration-200 text-sm"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/about" 
              className="text-gray-400 hover:text-blue-400 transition-colors duration-200 text-sm"
            >
              About
            </Link>
          </div>

          {/* Right side - Copyright */}
          <div className="text-gray-500 text-sm">
            © 2025 Gradual. All rights reserved.
          </div>
        </div>

        {/* Bottom section - Additional info */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <p className="text-gray-500 text-xs text-center md:text-left">
              Your AI-powered career development platform
            </p>
            <div className="flex items-center space-x-4">
              <Link 
                href="/about#contact" 
                className="text-gray-500 hover:text-blue-400 transition-colors duration-200 text-xs"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

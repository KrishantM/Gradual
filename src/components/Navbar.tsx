'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  TrendingUp, 
  Brain, 
  User, 
  LogOut, 
  LogIn, 
  UserPlus,
  Menu,
  X,
  Target,
  ChevronDown
} from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/5 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            href={user ? "/dashboard" : "/"} 
            className="flex items-center group"
            onClick={closeMobileMenu}
          >
            <Image 
              src="/newlogo2.png" 
              alt="Gradual" 
              width={100}
              height={100}
              unoptimized
              className="h-5 w-auto group-hover:opacity-80 transition-opacity duration-300"
              style={{ objectFit: 'contain' }}
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link href="/about">
              <Button
                variant="ghost"
                className="text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300"
              >
                About
              </Button>
            </Link>
            {user && (
              <>
                <Link href="/cvscore">
                  <Button
                    variant="ghost"
                    className="text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300"
                  >
                    CV Score
                  </Button>
                </Link>
                <Link href="/suggestions">
                  <Button
                    variant="ghost"
                    className="text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300"
                  >
                    Suggestions
                  </Button>
                </Link>
                <Link href="/tracker">
                  <Button
                    variant="ghost"
                    className="text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300"
                  >
                    Tracker
                  </Button>
                </Link>
                <div className="relative group">
                  <Button
                    variant="ghost"
                    className="text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 flex items-center"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Account
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Profile
                    </Link>
                    <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Settings
                    </Link>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
            {!user && (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <div className="flex flex-col space-y-2">
              <Link href="/about">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300"
                  onClick={closeMobileMenu}
                >
                  About
                </Button>
              </Link>
              {user && (
                <>
                  <Link href="/dashboard" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                    Dashboard
                  </Link>
                  <Link href="/cvscore" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                    CV Score
                  </Link>
                  <Link href="/suggestions" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                    Suggestions
                  </Link>
                  <Link href="/tracker" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                    Tracker
                  </Link>
                  <Link href="/profile" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                    Profile
                  </Link>
                  <Link href="/settings" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                    Settings
                  </Link>
                  <Button
                    onClick={() => {
                      logout();
                      closeMobileMenu();
                    }}
                    variant="ghost"
                    className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Logout
                  </Button>
                </>
              )}
              {!user && (
                <>
                  <Link href="/login">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300"
                      onClick={closeMobileMenu}
                    >
                      <LogIn className="h-4 w-4 mr-3" />
                      Login
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold transition-all duration-300"
                      onClick={closeMobileMenu}
                    >
                      <UserPlus className="h-4 w-4 mr-3" />
                      Register
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}



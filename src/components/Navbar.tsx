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
  X
} from 'lucide-react';
import { useState } from 'react';

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
            className="flex items-center space-x-2 group"
            onClick={closeMobileMenu}
          >
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center group-hover:from-blue-700 group-hover:to-cyan-700 transition-all duration-300">
              <Home className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors duration-300">
              ne<span className="text-blue-400">X</span>twork
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {user ? (
              <>
                <Link href="/cvscore">
                  <Button
                    variant="ghost"
                    className="text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    CV Score
                  </Button>
                </Link>
                <Link href="/suggestions">
                  <Button
                    variant="ghost"
                    className="text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Suggestions
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button
                    variant="ghost"
                    className="text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                </Link>
                <Button
                  onClick={logout}
                  variant="ghost"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
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
              {user ? (
                <>
                  <Link href="/cvscore">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300"
                      onClick={closeMobileMenu}
                    >
                      <TrendingUp className="h-4 w-4 mr-3" />
                      CV Score
                    </Button>
                  </Link>
                  <Link href="/suggestions">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300"
                      onClick={closeMobileMenu}
                    >
                      <Brain className="h-4 w-4 mr-3" />
                      Suggestions
                    </Button>
                  </Link>
                  <Link href="/profile">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300"
                      onClick={closeMobileMenu}
                    >
                      <User className="h-4 w-4 mr-3" />
                      Profile
                    </Button>
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
              ) : (
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



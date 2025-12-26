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
import { motion, AnimatePresence } from 'framer-motion';

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
    <motion.nav 
      className="fixed top-0 left-0 right-0 z-50 bg-white/5 backdrop-blur-md border-b border-white/10 shadow-lg"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
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
          <motion.div 
            className="hidden md:flex items-center space-x-1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {user && (
              <>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link href="/cvscore">
                    <Button
                      variant="ghost"
                      className="text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300"
                    >
                      CV Score
                    </Button>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link href="/suggestions">
                    <Button
                      variant="ghost"
                      className="text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300"
                    >
                      Opportunities Engine
                    </Button>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link href="/career-suggestions">
                    <Button
                      variant="ghost"
                      className="text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300"
                    >
                      Career Suggestions
                    </Button>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link href="/tracker">
                    <Button
                      variant="ghost"
                      className="text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300"
                    >
                      Tracker
                    </Button>
                  </Link>
                </motion.div>
                <motion.div 
                  className="relative group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    className="text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 flex items-center"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Account
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                  <motion.div 
                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50"
                    initial={{ opacity: 0, y: -10 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
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
                  </motion.div>
                </motion.div>
              </>
            )}
            {!user && (
              <>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link href="/login">
                    <Button
                      variant="ghost"
                      className="text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300"
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Login
                    </Button>
                  </Link>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                  animate={{ 
                    boxShadow: [
                      "0 0 0px rgba(59, 130, 246, 0)",
                      "0 0 10px rgba(59, 130, 246, 0.3)",
                      "0 0 0px rgba(59, 130, 246, 0)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Link href="/register">
                    <Button
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Register
                    </Button>
                  </Link>
                </motion.div>
              </>
            )}
          </motion.div>

          {/* Mobile Menu Button */}
          <motion.button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence mode="wait">
              {isMobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="h-5 w-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              className="md:hidden py-4 border-t border-white/10"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="flex flex-col space-y-2"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                {user && (
                  <>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Link href="/dashboard" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                        Dashboard
                      </Link>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Link href="/cvscore" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                        CV Score
                      </Link>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Link href="/suggestions" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                        Opportunities Engine
                      </Link>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Link href="/career-suggestions" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                        Career Suggestions
                      </Link>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Link href="/tracker" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                        Tracker
                      </Link>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Link href="/profile" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                        Profile
                      </Link>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Link href="/settings" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                        Settings
                      </Link>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
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
                    </motion.div>
                  </>
                )}
                {!user && (
                  <>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
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
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Link href="/register">
                        <Button
                          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold transition-all duration-300"
                          onClick={closeMobileMenu}
                        >
                          <UserPlus className="h-4 w-4 mr-3" />
                          Register
                        </Button>
                      </Link>
                    </motion.div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}



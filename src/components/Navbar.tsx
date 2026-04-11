'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Brain,
  User,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  X,
  Target,
  ChevronDown,
  Calendar,
  Moon,
  Sun,
  GraduationCap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const navButtonClass = 'h-9 rounded-md text-[var(--foreground)] hover:bg-[var(--surface-subtle)]';

  const applyTheme = (dark: boolean) => {
    setIsDarkMode(dark);
    if (typeof window === 'undefined') return;
    document.documentElement.classList.toggle('dark', dark);
    window.localStorage.setItem('gradual-theme', dark ? 'dark' : 'light');
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('gradual-theme');
    const shouldUseDark = stored === 'dark';
    applyTheme(shouldUseDark);
  }, []);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (accountMenuRef.current && !accountMenuRef.current.contains(target)) {
        setIsAccountOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(target)) {
        setIsMoreOpen(false);
      }
    };

    document.addEventListener('mousedown', onDocumentClick);
    return () => document.removeEventListener('mousedown', onDocumentClick);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsAccountOpen(false);
    setIsMoreOpen(false);
  };

  const dropdownClass = "absolute right-0 z-50 mt-2 w-52 rounded-xl border bg-[var(--surface)] py-1.5 shadow-[var(--shadow-lg)]";
  const dropdownItemClass = "block px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--surface-subtle)] transition-colors rounded-md mx-1";

  const ThemeToggle = () => (
    <button
      type="button"
      onClick={() => applyTheme(!isDarkMode)}
      className="flex w-full items-center justify-between text-sm text-[var(--foreground)]"
      aria-label="Toggle dark mode"
    >
      <span className="inline-flex items-center gap-2">
        {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        Dark mode
      </span>
      <span
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          isDarkMode ? 'bg-[var(--accent-blue)]' : 'bg-[var(--border-strong)]'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            isDarkMode ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  );

  return (
    <motion.nav
      className="fixed left-0 right-0 top-0 z-50 border-b bg-[var(--surface)]/90 backdrop-blur-md"
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={user ? '/dashboard' : '/'} className="flex items-center" onClick={closeMobileMenu}>
              <span className="logo-pill">
                <Image
                  src="/newlogo2.png"
                  alt="Gradual"
                  width={100}
                  height={100}
                  unoptimized
                  className="logo-img logo-full h-5 w-auto"
                  style={{ objectFit: 'contain' }}
                />
                <Image
                  src="/newlogo2.png"
                  alt=""
                  width={100}
                  height={100}
                  unoptimized
                  className="logo-img logo-g h-5 w-auto"
                  style={{ objectFit: 'contain' }}
                  aria-hidden
                />
                <Image
                  src="/newlogo2.png"
                  alt=""
                  width={100}
                  height={100}
                  unoptimized
                  className="logo-img logo-radual h-5 w-auto"
                  style={{ objectFit: 'contain' }}
                  aria-hidden
                />
              </span>
            </Link>
            {!user && (
              <button
                type="button"
                onClick={() => applyTheme(!isDarkMode)}
                className="hidden md:flex items-center justify-center rounded-full p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-subtle)] transition-colors"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            )}
            {user && (
              <div className="hidden items-center md:flex">
                <Link href="/copilot">
                  <Button variant="ghost" className={navButtonClass}>
                    <Brain className="mr-2 h-4 w-4 text-[var(--accent-blue)]" />
                    Copilot
                  </Button>
                </Link>
                <Link href="/paths">
                  <Button variant="ghost" className={navButtonClass}>
                    <GraduationCap className="mr-2 h-4 w-4 text-[var(--accent-blue)]" />
                    Paths
                  </Button>
                </Link>
                <div className="mx-1 h-5 w-px bg-[var(--border-soft)]" />
              </div>
            )}
          </div>

          <div className="hidden items-center gap-0.5 md:flex">
            {user && (
              <>
                <Link href="/suggestions">
                  <Button variant="ghost" className={navButtonClass}>
                    Opportunities
                  </Button>
                </Link>
                <Link href="/cvscore">
                  <Button variant="ghost" className={navButtonClass}>
                    CV Score
                  </Button>
                </Link>
                <Link href="/career-suggestions">
                  <Button variant="ghost" className={navButtonClass}>
                    Suggestions
                  </Button>
                </Link>
                <div className="relative" ref={moreMenuRef}>
                  <Button
                    variant="ghost"
                    className={navButtonClass}
                    onClick={() => {
                      setIsMoreOpen((prev) => !prev);
                      setIsAccountOpen(false);
                    }}
                  >
                    More
                    <ChevronDown className={`ml-1 h-3.5 w-3.5 transition-transform ${isMoreOpen ? 'rotate-180' : ''}`} />
                  </Button>
                  {isMoreOpen && (
                    <div className={dropdownClass}>
                      <Link href="/planner" onClick={() => setIsMoreOpen(false)} className={dropdownItemClass}>
                        Planner
                      </Link>
                      <Link href="/tracker" onClick={() => setIsMoreOpen(false)} className={dropdownItemClass}>
                        Tracker
                      </Link>
                      <Link href="/consulting" onClick={() => setIsMoreOpen(false)} className={dropdownItemClass}>
                        Consulting
                      </Link>
                    </div>
                  )}
                </div>
                <div className="relative" ref={accountMenuRef}>
                  <Button
                    variant="ghost"
                    className={navButtonClass}
                    onClick={() => {
                      setIsAccountOpen((prev) => !prev);
                      setIsMoreOpen(false);
                    }}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Account
                    <ChevronDown className={`ml-1 h-3.5 w-3.5 transition-transform ${isAccountOpen ? 'rotate-180' : ''}`} />
                  </Button>
                  {isAccountOpen && (
                    <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border bg-[var(--surface)] py-1 shadow-[var(--shadow-lg)]">
                      <Link href="/profile" className={dropdownItemClass}>
                        Profile
                      </Link>
                      <Link href="/settings" className={dropdownItemClass}>
                        Settings
                      </Link>
                      <div className="mx-2 my-1 rounded-md border px-3 py-2">
                        <ThemeToggle />
                      </div>
                      <div className="my-1 border-t" />
                      <button onClick={logout} className="w-full px-4 py-2 text-left text-sm text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors">
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
            {!user && (
              <>
                <Link href="/login">
                  <Button variant="ghost" className={navButtonClass}>
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="h-9 rounded-md px-4 text-sm font-semibold">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>

          <motion.button
            onClick={toggleMobileMenu}
            className="rounded-md border bg-[var(--surface)] p-2 text-[var(--foreground)] transition-colors hover:bg-[var(--surface-subtle)] md:hidden"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <AnimatePresence mode="wait">
              {isMobileMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -80, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 80, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <X className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 80, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -80, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Menu className="h-5 w-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="border-t py-3 md:hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="flex flex-col space-y-0.5"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2, delay: 0.02 }}
              >
                {user && (
                  <>
                    <Link href="/dashboard" onClick={closeMobileMenu} className="rounded-md px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-subtle)]">
                      Dashboard
                    </Link>
                    <Link href="/copilot" onClick={closeMobileMenu} className="rounded-md px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-subtle)]">
                      <Brain className="mr-2 inline h-4 w-4 text-[var(--accent-blue)]" />
                      Copilot
                    </Link>
                    <Link href="/paths" onClick={closeMobileMenu} className="rounded-md px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-subtle)]">
                      <GraduationCap className="mr-2 inline h-4 w-4 text-[var(--accent-blue)]" />
                      Paths
                    </Link>
                    <Link href="/suggestions" onClick={closeMobileMenu} className="rounded-md px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-subtle)]">
                      Opportunities
                    </Link>
                    <Link href="/cvscore" onClick={closeMobileMenu} className="rounded-md px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-subtle)]">
                      CV Score
                    </Link>
                    <Link href="/career-suggestions" onClick={closeMobileMenu} className="rounded-md px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-subtle)]">
                      Suggestions
                    </Link>
                    <Link href="/planner" onClick={closeMobileMenu} className="rounded-md px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-subtle)]">
                      <Calendar className="mr-2 inline h-4 w-4" />
                      Planner
                    </Link>
                    <Link href="/tracker" onClick={closeMobileMenu} className="rounded-md px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-subtle)]">
                      Tracker
                    </Link>
                    <Link href="/consulting" onClick={closeMobileMenu} className="rounded-md px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-subtle)]">
                      <Target className="mr-2 inline h-4 w-4" />
                      Consulting
                    </Link>
                    <Link href="/profile" onClick={closeMobileMenu} className="rounded-md px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-subtle)]">
                      Profile
                    </Link>
                    <Link href="/settings" onClick={closeMobileMenu} className="rounded-md px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-subtle)]">
                      Settings
                    </Link>
                    <Button
                      onClick={() => {
                        logout();
                        closeMobileMenu();
                      }}
                      variant="ghost"
                      className="h-9 justify-start rounded-md text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </>
                )}
                {!user && (
                  <>
                    <Link href="/consulting" onClick={closeMobileMenu}>
                      <Button variant="ghost" className="h-9 w-full justify-start rounded-md">
                        <Target className="mr-2 h-4 w-4" />
                        Consulting
                      </Button>
                    </Link>
                    <Link href="/login" onClick={closeMobileMenu}>
                      <Button variant="ghost" className="h-9 w-full justify-start rounded-md">
                        <LogIn className="mr-2 h-4 w-4" />
                        Login
                      </Button>
                    </Link>
                    <Link href="/register" onClick={closeMobileMenu}>
                      <Button className="h-9 w-full rounded-md">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Register
                      </Button>
                    </Link>
                  </>
                )}
                <div className="mx-1 mt-2 rounded-md border px-3 py-2">
                  <ThemeToggle />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}

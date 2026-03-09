'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function ConsultingNavbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  const navItems = [
    { href: '/consulting', label: 'Consulting' },
    { href: '/consulting/services', label: 'Services' },
    { href: '/consulting/how-it-works', label: 'How it works' },
    { href: '/consulting/pricing', label: 'Pricing' },
    { href: '/consulting/about', label: 'About' },
  ];

  const isActive = (href: string) => {
    if (href === '/consulting') {
      return pathname === '/consulting';
    }
    return pathname === href || pathname?.startsWith(href + '/');
  };

  const navTextClass = 'text-slate-800 dark:text-slate-200';
  const navTextActiveClass = 'text-slate-900 dark:text-white';
  const navHoverClass = 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - black text in light mode, white in dark (logo-pill handles split) */}
          <Link href="/" className="flex items-center group">
            <span className="logo-pill group-hover:opacity-90 transition-opacity duration-300">
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
                aria-hidden
                style={{ objectFit: 'contain' }}
              />
              <Image
                src="/newlogo2.png"
                alt=""
                width={100}
                height={100}
                unoptimized
                className="logo-img logo-radual h-5 w-auto"
                aria-hidden
                style={{ objectFit: 'contain' }}
              />
            </span>
          </Link>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={`text-sm font-medium relative pb-1 ${isActive(item.href) ? navTextActiveClass : `${navTextClass} ${navHoverClass}`} transition-all duration-300`}
                >
                  {item.label}
                  {isActive(item.href) && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
                  )}
                </Button>
              </Link>
            ))}
          </div>

          {/* Desktop Actions - Right side */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/consulting/contact">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-all duration-200">
                Book a call
              </Button>
            </Link>
            <button
              type="button"
              onClick={() => applyTheme(!isDarkMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-slate-300'}`}
              aria-label="Toggle dark mode"
              title="Toggle dark mode"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${isDarkMode ? 'translate-x-5' : 'translate-x-0.5'}`}
              />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden p-2 rounded-md ${navTextClass} ${navHoverClass}`}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 dark:border-slate-700/50">
            <div className="flex flex-col space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-md text-base font-medium relative ${isActive(item.href) ? navTextActiveClass : `${navTextClass} ${navHoverClass}`}`}
                >
                  {item.label}
                  {isActive(item.href) && (
                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-600 via-indigo-600 to-purple-600 rounded-l-md" />
                  )}
                </Link>
              ))}
              <div className="mx-3 mt-2 py-2 flex items-center justify-between">
                <span className="text-sm text-slate-700 dark:text-slate-300">Dark mode</span>
                <button
                  type="button"
                  onClick={() => applyTheme(!isDarkMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${isDarkMode ? 'translate-x-5' : 'translate-x-0.5'}`}
                  />
                </button>
              </div>
              <Link
                href="/consulting/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="mt-2 mx-3 px-3 py-2 rounded-md text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 text-center"
              >
                Book a call
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}


'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';

export default function ConsultingNavbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/5 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - links to main Gradual site */}
          <Link href="/" className="flex items-center group">
            <Image 
              src="/newlogo2.png" 
              alt="Gradual" 
              width={100}
              height={100}
              className="h-5 w-auto group-hover:opacity-80 transition-opacity duration-300"
              unoptimized
              style={{ objectFit: 'contain' }}
            />
          </Link>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center gap-2 absolute left-1/2 transform -translate-x-1/2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={`text-sm font-medium relative pb-1 ${
                    isActive(item.href)
                      ? 'text-white'
                      : 'text-gray-300 hover:text-white'
                  } transition-all duration-300`}
                >
                  {item.label}
                  {isActive(item.href) && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 shadow-[0_0_4px_rgba(251,191,36,0.4)]"></span>
                  )}
                </Button>
              </Link>
            ))}
            <Link href="/consulting/contact">
              <Button className="bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-[0_0_12px_rgba(251,191,36,0.3)]">
                Book a call
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-300 hover:text-white hover:bg-white/10"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <div className="flex flex-col space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-md text-base font-medium relative ${
                    isActive(item.href)
                      ? 'text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {item.label}
                  {isActive(item.href) && (
                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 via-yellow-400 to-amber-500 rounded-l-md shadow-[0_0_4px_rgba(251,191,36,0.4)]"></span>
                  )}
                </Link>
              ))}
              <Link
                href="/consulting/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="mt-4 px-3 py-2 rounded-md text-base font-medium bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 text-center shadow-[0_0_12px_rgba(251,191,36,0.3)]"
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

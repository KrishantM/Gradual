'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Brain,
  GraduationCap,
  Briefcase,
  FileText,
  Lightbulb,
  Calendar,
  ClipboardList,
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const primaryNav: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/copilot', label: 'Copilot', icon: Brain },
  { href: '/paths', label: 'Paths', icon: GraduationCap },
];

const workspaceNav: NavItem[] = [
  { href: '/suggestions', label: 'Opportunities', icon: Briefcase },
  { href: '/cvscore', label: 'CV Score', icon: FileText },
  { href: '/career-suggestions', label: 'Suggestions', icon: Lightbulb },
  { href: '/planner', label: 'Planner', icon: Calendar },
  { href: '/tracker', label: 'Tracker', icon: ClipboardList },
];

const accountNav: NavItem[] = [
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`sidebar-nav-item ${active ? 'active' : ''}`}
    >
      <Icon className="nav-icon" />
      <span>{item.label}</span>
    </Link>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    applyTheme(stored === 'dark');
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <div
          className="sidebar-overlay lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`app-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="flex items-center justify-between px-4 h-14 shrink-0 border-b border-[var(--border-soft)]">
          <Link href="/dashboard" className="flex items-center">
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
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-subtle)]"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          <div className="space-y-0.5">
            {primaryNav.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} onClick={() => setSidebarOpen(false)} />
            ))}
          </div>

          <div>
            <div className="sidebar-section-label mb-1.5">Workspace</div>
            <div className="space-y-0.5">
              {workspaceNav.map((item) => (
                <NavLink key={item.href} item={item} active={isActive(item.href)} onClick={() => setSidebarOpen(false)} />
              ))}
            </div>
          </div>

          <div>
            <div className="sidebar-section-label mb-1.5">Account</div>
            <div className="space-y-0.5">
              {accountNav.map((item) => (
                <NavLink key={item.href} item={item} active={isActive(item.href)} onClick={() => setSidebarOpen(false)} />
              ))}
            </div>
          </div>
        </nav>

        <div className="shrink-0 px-3 py-3 border-t border-[var(--border-soft)] space-y-1">
          {user && (
            <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
              <div className="sidebar-avatar">
                {user.displayName
                  ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                  : user.email?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-[var(--foreground)] truncate">
                  {user.displayName || 'Student'}
                </div>
                <div className="text-[0.6875rem] text-[var(--text-subtle)] truncate">
                  {user.email}
                </div>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => applyTheme(!isDarkMode)}
            className="sidebar-nav-item w-full"
          >
            {isDarkMode ? <Sun className="nav-icon" /> : <Moon className="nav-icon" />}
            <span>{isDarkMode ? 'Light mode' : 'Dark mode'}</span>
          </button>
          <button
            type="button"
            onClick={logout}
            className="sidebar-nav-item w-full text-[var(--danger)] hover:bg-[var(--danger-soft)]"
          >
            <LogOut className="nav-icon" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <div className="app-main">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-[var(--border-soft)] bg-[var(--surface)]/90 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--foreground)] hover:bg-[var(--surface-subtle)] transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/dashboard" className="flex items-center">
            <span className="logo-pill">
              <Image
                src="/newlogo2.png"
                alt="Gradual"
                width={80}
                height={80}
                unoptimized
                className="logo-img logo-full h-5 w-auto"
                style={{ objectFit: 'contain' }}
              />
              <Image
                src="/newlogo2.png"
                alt=""
                width={80}
                height={80}
                unoptimized
                className="logo-img logo-g h-5 w-auto"
                style={{ objectFit: 'contain' }}
                aria-hidden
              />
              <Image
                src="/newlogo2.png"
                alt=""
                width={80}
                height={80}
                unoptimized
                className="logo-img logo-radual h-5 w-auto"
                style={{ objectFit: 'contain' }}
                aria-hidden
              />
            </span>
          </Link>
          <div className="w-10" />
        </div>
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Footer from './Footer';
import Navbar from './Navbar';
import AppShell from './AppShell';
import { UserRoleService } from '@/lib/user-role';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

const PUBLIC_PATHS = ['/', '/login', '/register', '/about', '/pricing', '/terms', '/privacy'];
const CONSULTING_PREFIX = '/consulting';
const RECRUITER_PREFIX = '/recruiter';

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [shouldShowNavbar, setShouldShowNavbar] = useState(true);

  const currentPath = pathname || '/';

  const isConsultingPage = currentPath.startsWith(CONSULTING_PREFIX);
  const isRecruiterPage = currentPath.startsWith(RECRUITER_PREFIX);
  const isPublicPage = PUBLIC_PATHS.includes(currentPath);
  const isFixRolePage = currentPath === '/fix-role';
  const isOnboardingPage = currentPath === '/onboarding';
  const isPricingPage = currentPath === '/pricing';
  const isLegalPage = currentPath === '/terms' || currentPath === '/privacy';

  useEffect(() => {
    if (isConsultingPage) return;

    const checkUserRole = async () => {
      if (user && (isRecruiterPage || isPricingPage || isLegalPage)) {
        try {
          const userRole = await UserRoleService.getUserRole(user);
          setShouldShowNavbar(userRole.role !== 'recruiter');
        } catch (error) {
          console.error('Error checking user role for navbar:', error);
          setShouldShowNavbar(true);
        }
      } else {
        setShouldShowNavbar(true);
      }
    };

    checkUserRole();
  }, [user, isRecruiterPage, isPricingPage, isLegalPage, isConsultingPage]);

  if (isConsultingPage) {
    return (
      <main className="flex-1">
        {children}
      </main>
    );
  }

  if (user && !isPublicPage && !isRecruiterPage && !isFixRolePage && !isOnboardingPage) {
    return <AppShell>{children}</AppShell>;
  }

  const shouldShowFooter = currentPath !== '/';

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      <main className={`flex-1 ${shouldShowNavbar ? 'pt-14' : ''}`}>
        {children}
      </main>
      {shouldShowFooter && <Footer />}
    </>
  );
}

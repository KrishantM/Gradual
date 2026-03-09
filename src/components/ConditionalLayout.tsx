'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Footer from './Footer';
import Navbar from './Navbar';
import { UserRoleService } from '@/lib/user-role';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [shouldShowNavbar, setShouldShowNavbar] = useState(true);
  
  // Handle null pathname
  const currentPath = pathname || '/';
  
  // Don't show footer on the main landing page (root path)
  const shouldShowFooter = currentPath !== '/';
  
  // Check if current page is a consulting page (has its own layout)
  const isConsultingPage = currentPath.startsWith('/consulting');
  
  // Check if current page is a recruiter page, pricing page, or legal pages
  const isRecruiterPage = currentPath.startsWith('/recruiter');
  const isPricingPage = currentPath === '/pricing';
  const isLegalPage = currentPath === '/terms' || currentPath === '/privacy';
  
  // Check user role to determine navbar visibility
  // IMPORTANT: All hooks must be called before any conditional returns
  useEffect(() => {
    // Skip effect for consulting pages
    if (isConsultingPage) {
      return;
    }
    
    const checkUserRole = async () => {
      if (user && (isRecruiterPage || isPricingPage || isLegalPage)) {
        try {
          const userRole = await UserRoleService.getUserRole(user);
          // Hide navbar for recruiters on recruiter pages, pricing page, and legal pages
          setShouldShowNavbar(userRole.role !== 'recruiter');
        } catch (error) {
          console.error('Error checking user role for navbar:', error);
          // Default to showing navbar on error
          setShouldShowNavbar(true);
        }
      } else {
        // Show navbar for non-recruiter pages or when not logged in
        setShouldShowNavbar(true);
      }
    };
    
    checkUserRole();
  }, [user, isRecruiterPage, isPricingPage, isLegalPage, isConsultingPage]);
  
  // Don't show main navbar/footer on consulting pages (they have their own)
  if (isConsultingPage) {
    return (
      <main className="flex-1">
        {children}
      </main>
    );
  }

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      <main className={`flex-1 ${shouldShowNavbar ? 'pt-16' : ''}`}>
        {children}
      </main>
      {shouldShowFooter && <Footer />}
    </>
  );
}

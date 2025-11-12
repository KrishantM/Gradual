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
  
  // Don't show footer on the main landing page (root path)
  const shouldShowFooter = pathname !== '/';
  
  // Check if current page is a recruiter page, pricing page, or legal pages
  const isRecruiterPage = pathname.startsWith('/recruiter');
  const isPricingPage = pathname === '/pricing';
  const isLegalPage = pathname === '/terms' || pathname === '/privacy';
  
  // Check user role to determine navbar visibility
  useEffect(() => {
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
  }, [user, isRecruiterPage, isPricingPage, isLegalPage]);

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      <main className="flex-1">
        {children}
      </main>
      {shouldShowFooter && <Footer />}
    </>
  );
}

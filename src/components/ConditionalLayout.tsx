'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // Don't show footer on the main landing page (root path)
  const shouldShowFooter = pathname !== '/';

  return (
    <>
      <main className="flex-1">
        {children}
      </main>
      {shouldShowFooter && <Footer />}
    </>
  );
}

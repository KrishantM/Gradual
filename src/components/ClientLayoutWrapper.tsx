'use client';

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  return (
    <>
      {!isAuthPage && <Navbar />}
      {children}
    </>
  );
}

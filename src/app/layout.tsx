import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import MaintenancePage from "@/components/MaintenancePage";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gradual",
  description: "Your Future, Curated.",
};

// Set this to true to enable maintenance mode
const MAINTENANCE_MODE = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // If maintenance mode is enabled, show maintenance page
  if (MAINTENANCE_MODE) {
    return (
      <html lang="en">
        <body className={inter.className}>
          <MaintenancePage />
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

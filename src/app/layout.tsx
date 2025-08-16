import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import MaintenancePage from "@/components/MaintenancePage";
import StructuredData from "@/components/StructuredData";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gradual - AI Career Tool & Career Builder | Your Future, Curated",
  description: "Gradual is the leading AI career tool and career builder platform. Get AI-driven CV scoring, smart role suggestions, and personalized career guidance. Join thousands of professionals using our AI career builder.",
  keywords: "Gradual, AI Career Tool, AI Career Builder, CV scoring, career guidance, job matching, AI resume analysis, career development, professional growth, job search AI",
  authors: [{ name: "Gradual Team" }],
  creator: "Gradual",
  publisher: "Gradual",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://gradual.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Gradual - AI Career Tool & Career Builder",
    description: "The leading AI career tool and career builder platform. Get AI-driven CV scoring, smart role suggestions, and personalized career guidance.",
    url: 'https://gradual.com',
    siteName: 'Gradual',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Gradual - AI Career Tool & Career Builder',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Gradual - AI Career Tool & Career Builder",
    description: "The leading AI career tool and career builder platform. Get AI-driven CV scoring, smart role suggestions, and personalized career guidance.",
    images: ['/og-image.png'],
    creator: '@gradual',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
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
      <head>
        <StructuredData />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

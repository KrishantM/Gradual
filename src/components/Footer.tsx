'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center">
            <span className="logo-pill">
              <Image
                src="/newlogo2.png"
                alt="Gradual Logo"
                width={150}
                height={45}
                unoptimized
                className="logo-img logo-full h-7 w-auto"
                style={{ objectFit: 'contain' }}
              />
              <Image
                src="/newlogo2.png"
                alt=""
                width={150}
                height={45}
                unoptimized
                className="logo-img logo-g h-7 w-auto"
                aria-hidden
                style={{ objectFit: 'contain' }}
              />
              <Image
                src="/newlogo2.png"
                alt=""
                width={150}
                height={45}
                unoptimized
                className="logo-img logo-radual h-7 w-auto"
                aria-hidden
                style={{ objectFit: 'contain' }}
              />
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 text-sm">
            <Link href="/about" className="text-slate-600 dark:text-slate-400 transition-colors hover:text-slate-900 dark:hover:text-white">
              About
            </Link>
            <Link href="/pricing" className="text-slate-600 dark:text-slate-400 transition-colors hover:text-slate-900 dark:hover:text-white">
              Pricing
            </Link>
            <Link href="/consulting" className="text-slate-600 dark:text-slate-400 transition-colors hover:text-slate-900 dark:hover:text-white">
              Consulting
            </Link>
            <Link href="/terms" className="text-slate-600 dark:text-slate-400 transition-colors hover:text-slate-900 dark:hover:text-white">
              Terms
            </Link>
            <Link href="/privacy" className="text-slate-600 dark:text-slate-400 transition-colors hover:text-slate-900 dark:hover:text-white">
              Privacy
            </Link>
          </div>

          <div className="text-sm text-slate-500 dark:text-slate-400">{'\u00A9'} 2026 Gradual</div>
        </div>

        <div className="mt-6 border-t border-slate-200 dark:border-slate-700/50 pt-5 text-center text-xs text-slate-500 dark:text-slate-400 md:text-left">
          <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
            <p>AI-powered career platform for students and early professionals.</p>
            <a href="mailto:admin@gradual.co.nz" className="transition-colors hover:text-slate-700 dark:hover:text-slate-200">
              admin@gradual.co.nz
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

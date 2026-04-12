'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="mt-auto border-t bg-[var(--surface)]">
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
            <Link href="/about" className="text-[var(--text-muted)] transition-colors hover:text-[var(--foreground)]">
              About
            </Link>
            <Link href="/pricing" className="text-[var(--text-muted)] transition-colors hover:text-[var(--foreground)]">
              Pricing
            </Link>
            <Link href="/consulting" className="text-[var(--text-muted)] transition-colors hover:text-[var(--foreground)]">
              Consulting
            </Link>
            <Link href="/terms" className="text-[var(--text-muted)] transition-colors hover:text-[var(--foreground)]">
              Terms
            </Link>
            <Link href="/privacy" className="text-[var(--text-muted)] transition-colors hover:text-[var(--foreground)]">
              Privacy
            </Link>
          </div>

          <div className="text-sm text-[var(--text-subtle)]">{'\u00A9'} 2026 Gradual</div>
        </div>

        <div className="mt-6 border-t pt-5 text-center text-xs text-[var(--text-subtle)] md:text-left">
          <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
            <p>AI-powered career platform for students and early professionals.</p>
            <a href="mailto:admin@gradual.co.nz" className="transition-colors hover:text-[var(--foreground)]">
              admin@gradual.co.nz
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

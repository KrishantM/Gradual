'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function ConsultingFooter() {
  const linkClass = 'text-sm text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors';
  const headingClass = 'text-sm font-semibold text-slate-900 dark:text-slate-100';

  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-8 md:gap-4">
          {/* Brand */}
          <div className="flex-shrink-0">
            <div className="flex items-center gap-2 mb-4">
              <span className="logo-pill">
                <Image
                  src="/newlogo2.png"
                  alt=""
                  width={120}
                  height={40}
                  unoptimized
                  className="logo-img logo-full h-6 w-auto"
                  style={{ objectFit: 'contain' }}
                />
                <Image
                  src="/newlogo2.png"
                  alt=""
                  width={120}
                  height={40}
                  unoptimized
                  className="logo-img logo-g h-6 w-auto"
                  aria-hidden
                  style={{ objectFit: 'contain' }}
                />
                <Image
                  src="/newlogo2.png"
                  alt=""
                  width={120}
                  height={40}
                  unoptimized
                  className="logo-img logo-radual h-6 w-auto"
                  aria-hidden
                  style={{ objectFit: 'contain' }}
                />
              </span>
              <span className={`text-sm font-medium ${headingClass}`}>Consulting</span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Premium career guidance and pathway planning.
            </p>
          </div>

          {/* Navigation and Main Site */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 md:ml-auto">
            <div>
              <h3 className={`mb-4 ${headingClass}`}>Navigation</h3>
              <ul className="space-y-2">
                <li><Link href="/consulting" className={linkClass}>Consulting</Link></li>
                <li><Link href="/consulting/services" className={linkClass}>Services</Link></li>
                <li><Link href="/consulting/how-it-works" className={linkClass}>How it works</Link></li>
                <li><Link href="/consulting/pricing" className={linkClass}>Pricing</Link></li>
                <li><Link href="/consulting/about" className={linkClass}>About</Link></li>
              </ul>
            </div>
            <div>
              <h3 className={`mb-4 ${headingClass}`}>Main Site</h3>
              <Link href="/" className={linkClass}>Explore Gradual →</Link>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200 dark:border-slate-700/50 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              {'\u00A9'} 2026 Gradual Consulting. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <Link href="/terms" className={linkClass}>Terms</Link>
              <Link href="/privacy" className={linkClass}>Privacy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}



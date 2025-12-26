'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function ConsultingFooter() {
  return (
    <footer className="border-t border-white/10 mt-auto bg-slate-900/50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-8 md:gap-4">
          {/* Brand */}
          <div className="flex-shrink-0">
            <div className="flex items-center mb-4">
              <Image
                src="/newlogo2.png"
                alt="Gradual Consulting"
                width={120}
                height={40}
                className="h-6 w-auto"
                unoptimized
              />
              <span className="ml-2 text-sm font-medium text-gray-300">Consulting</span>
            </div>
            <p className="text-sm text-gray-400">
              Premium career guidance and pathway planning.
            </p>
          </div>

          {/* Navigation and Main Site - Grouped together */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 md:ml-auto">
            {/* Navigation */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Navigation</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/consulting" className="text-sm text-gray-400 hover:text-white transition-colors">
                    Consulting
                  </Link>
                </li>
                <li>
                  <Link href="/consulting/services" className="text-sm text-gray-400 hover:text-white transition-colors">
                    Services
                  </Link>
                </li>
                <li>
                  <Link href="/consulting/how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors">
                    How it works
                  </Link>
                </li>
                <li>
                  <Link href="/consulting/pricing" className="text-sm text-gray-400 hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/consulting/about" className="text-sm text-gray-400 hover:text-white transition-colors">
                    About
                  </Link>
                </li>
              </ul>
            </div>

            {/* Main Site */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Main Site</h3>
              <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
                Explore Gradual →
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              © 2025 Gradual Consulting. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <Link href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}


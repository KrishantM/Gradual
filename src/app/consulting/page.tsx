import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Section from '@/components/consulting/Section';
import { ArrowRight, CheckCircle } from 'lucide-react';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Gradual Consulting - Premium Career Guidance',
  description: 'Expert career consulting for high school, university, and early career professionals. Get clarity, a strategic plan, and actionable next steps.',
};

export default function ConsultingLandingPage() {
  const h1Class = 'text-3xl md:text-4xl lg:text-5xl font-light text-slate-900 dark:text-slate-100 mb-4 leading-tight';
  const h2Class = 'text-3xl md:text-4xl font-bold text-slate-900 dark:text-white';
  const titleClass = 'text-2xl font-semibold text-slate-900 dark:text-white';
  const bodyClass = 'text-slate-700 dark:text-slate-200';
  const accentClass = 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent';
  const stripClass = 'bg-slate-100 dark:bg-slate-800/60 border-y border-slate-200 dark:border-slate-700/50';
  const cardClass = 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all';
  const badgeClass = 'inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50';
  const outlineBtnClass = 'px-8 py-6 text-lg border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-500 transition-all';

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero Section */}
      <Section className="pt-12 pb-16 md:pt-16 md:pb-20">
        <div className="text-center max-w-3xl mx-auto">
          <div className="mb-8 flex justify-center">
            <span className="logo-pill logo-pill-hero">
              <Image
                src="/newlogo2.png"
                alt="Gradual"
                width={200}
                height={200}
                priority
                unoptimized
                className="logo-img logo-full h-8 md:h-10 lg:h-12 w-auto"
                style={{ objectFit: 'contain' }}
              />
              <Image
                src="/newlogo2.png"
                alt=""
                width={200}
                height={200}
                unoptimized
                className="logo-img logo-g h-8 md:h-10 lg:h-12 w-auto"
                aria-hidden
                style={{ objectFit: 'contain' }}
              />
              <Image
                src="/newlogo2.png"
                alt=""
                width={200}
                height={200}
                unoptimized
                className="logo-img logo-radual h-8 md:h-10 lg:h-12 w-auto"
                aria-hidden
                style={{ objectFit: 'contain' }}
              />
            </span>
          </div>
          <h1 className={h1Class}>
            Career <span className={accentClass}>Consulting</span>
          </h1>
          <div className="mb-6">
            <span className={badgeClass}>
              Premium 1:1 guidance
            </span>
          </div>
          <p className={`text-lg md:text-xl ${bodyClass} mb-10 leading-relaxed`}>
            Get clarity, a strategic plan, and actionable next steps.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/consulting/contact">
              <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-200">
                Book a free 10-min fit check
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/consulting/how-it-works">
              <Button size="lg" variant="outline" className={outlineBtnClass}>
                Learn how it works
              </Button>
            </Link>
          </div>
        </div>
      </Section>

      {/* Who it's for Section */}
      <section className={`w-full py-12 md:py-16 ${stripClass}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className={`${h2Class} mb-4`}>
              <span className={accentClass}>Who</span> it&apos;s for
            </h2>
            <p className={`text-lg ${bodyClass} max-w-2xl mx-auto`}>
              Two distinct tracks tailored to your stage
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <Card className={cardClass}>
              <CardHeader>
                <CardTitle className={titleClass}>High School & Pre-University Pathways</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`mb-4 ${bodyClass}`}>
                  For students and parents navigating university applications, course selection, and early career planning.
                </p>
                <ul className={`space-y-2 ${bodyClass}`}>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                    <span>University course selection</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                    <span>Application strategy</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                    <span>Early career exploration</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className={cardClass}>
              <CardHeader>
                <CardTitle className={titleClass}>University & Early Career</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`mb-4 ${bodyClass}`}>
                  For students and graduates seeking internships, graduate roles, and early career positioning.
                </p>
                <ul className={`space-y-2 ${bodyClass}`}>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>Internship applications</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>Graduate role strategy</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>Career positioning</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What you'll leave with Section */}
      <Section className="py-12 md:py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className={`${h2Class} mb-4`}>
              <span className={accentClass}>What</span> you&apos;ll leave with
            </h2>
          </div>
          <Card className={`${cardClass} p-8 md:p-12 rounded-2xl`}>
            <CardContent className="p-0">
              <ul className="grid md:grid-cols-2 gap-6">
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 mr-3 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                  <div>
                    <span className={titleClass}>A Clear Plan</span>
                    <span className={bodyClass}> — Strategic roadmap tailored to your goals</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 mr-3 mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                  <div>
                    <span className={titleClass}>Positioning Strategy</span>
                    <span className={bodyClass}> — How to present yourself effectively</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 mr-3 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                  <div>
                    <span className={titleClass}>Next Steps</span>
                    <span className={bodyClass}> — Actionable items to move forward</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 mr-3 mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                  <div>
                    <span className={titleClass}>Master Document</span>
                    <span className={bodyClass}> — Comprehensive 1-2 page take-home asset</span>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* CTA Section */}
      <section className={`w-full py-12 md:py-16 ${stripClass}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className={`${h2Class} mb-4`}>
              Ready to get started?
            </h2>
            <p className={`text-lg mb-8 ${bodyClass}`}>
              Book a free 10-minute fit check to see if Gradual Consulting is right for you.
            </p>
            <Link href="/consulting/contact">
              <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-200">
                Book a free 10-min fit check
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}


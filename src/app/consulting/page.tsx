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
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black">
      {/* Hero Section - Navy background */}
      <Section className="pt-12 pb-16 md:pt-16 md:pb-20">
        <div className="text-center max-w-3xl mx-auto">
          <div className="mb-8 flex justify-center">
            <Image 
              src="/newlogo2.png" 
              alt="Gradual" 
              width={200}
              height={200}
              priority
              unoptimized
              className="h-8 md:h-10 lg:h-12 w-auto drop-shadow-2xl"
              style={{ objectFit: 'contain' }}
            />
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-200 mb-4 leading-tight">
            Career <span className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 bg-clip-text text-transparent">Consulting</span>
          </h1>
          <div className="mb-6">
            <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-amber-500/30 via-yellow-400/30 to-amber-500/30 text-amber-300 border border-amber-400/50 shadow-[0_0_4px_rgba(251,191,36,0.3)]">
              Premium 1:1 guidance
            </span>
          </div>
          <p className="text-lg md:text-xl text-gray-300 mb-10 leading-relaxed">
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
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg border-2 border-amber-400/50 text-amber-300 hover:bg-amber-500/20 hover:border-amber-400/70 shadow-[0_0_4px_rgba(251,191,36,0.2)] hover:shadow-[0_0_6px_rgba(251,191,36,0.3)] transition-all">
                Learn how it works
              </Button>
            </Link>
          </div>
        </div>
      </Section>

      {/* Who it's for Section - Light blue strip */}
      <section className="w-full py-12 md:py-16 bg-blue-500/10 backdrop-blur-md border-y border-blue-400/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              <span className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 bg-clip-text text-transparent">Who</span> it's for
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Two distinct tracks tailored to your stage
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-lg hover:bg-white/10 transition-all">
              <CardHeader>
                <CardTitle className="text-2xl text-white">High School & Pre-University Pathways</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-gray-300">
                  For students and parents navigating university applications, course selection, and early career planning.
                </p>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-blue-400" />
                    <span>University course selection</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-blue-400" />
                    <span>Application strategy</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-blue-400" />
                    <span>Early career exploration</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-lg hover:bg-white/10 transition-all">
              <CardHeader>
                <CardTitle className="text-2xl text-white">University & Early Career</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-gray-300">
                  For students and graduates seeking internships, graduate roles, and early career positioning.
                </p>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start">
                    <div className="mr-2 mt-0.5 flex-shrink-0 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 blur-sm opacity-40"></div>
                    <CheckCircle className="h-5 w-5 relative text-amber-400" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' }} />
                    </div>
                    <span>Internship applications</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-2 mt-0.5 flex-shrink-0 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 blur-sm opacity-40"></div>
                    <CheckCircle className="h-5 w-5 relative text-amber-400" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' }} />
                    </div>
                    <span>Graduate role strategy</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-2 mt-0.5 flex-shrink-0 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 blur-sm opacity-40"></div>
                    <CheckCircle className="h-5 w-5 relative text-amber-400" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' }} />
                    </div>
                    <span>Career positioning</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What you'll leave with Section - Navy background */}
      <Section className="py-12 md:py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              <span className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 bg-clip-text text-transparent">What</span> you'll leave with
            </h2>
          </div>
          <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-lg p-8 md:p-12 rounded-2xl">
            <CardContent className="p-0">
              <ul className="grid md:grid-cols-2 gap-6">
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 mr-3 mt-0.5 flex-shrink-0 text-blue-400" />
                  <div>
                    <span className="font-semibold text-white">A Clear Plan</span>
                    <span className="text-gray-300"> — Strategic roadmap tailored to your goals</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="mr-3 mt-0.5 flex-shrink-0 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 blur-sm opacity-40"></div>
                    <CheckCircle className="h-6 w-6 relative text-amber-400" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' }} />
                  </div>
                  <div>
                    <span className="font-semibold text-white">Positioning Strategy</span>
                    <span className="text-gray-300"> — How to present yourself effectively</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 mr-3 mt-0.5 flex-shrink-0 text-blue-400" />
                  <div>
                    <span className="font-semibold text-white">Next Steps</span>
                    <span className="text-gray-300"> — Actionable items to move forward</span>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="mr-3 mt-0.5 flex-shrink-0 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 blur-sm opacity-40"></div>
                    <CheckCircle className="h-6 w-6 relative text-amber-400" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' }} />
                  </div>
                  <div>
                    <span className="font-semibold text-white">Master Document</span>
                    <span className="text-gray-300"> — Comprehensive 1-2 page take-home asset</span>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* CTA Section - Light blue strip */}
      <section className="w-full py-12 md:py-16 bg-blue-500/10 backdrop-blur-md border-y border-blue-400/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Ready to get started?
            </h2>
            <p className="text-lg mb-8 text-gray-300">
              Book a free 10-minute fit check to see if Gradual Consulting is right for you.
            </p>
            <Link href="/consulting/contact">
              <Button size="lg" className="bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-200 shadow-[0_0_12px_rgba(251,191,36,0.3)]">
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

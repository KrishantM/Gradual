import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Section from '@/components/consulting/Section';
import { CheckCircle, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Services - Gradual Consulting',
  description: 'Comprehensive career consulting services for high school, university, and early career professionals.',
};

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black">
      {/* Hero */}
      <Section className="pt-12 pb-16 md:pt-16 md:pb-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Our <span className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 bg-clip-text text-transparent">Services</span>
          </h1>
          <p className="text-xl text-gray-300">
            Two specialized tracks designed for your stage of career development
          </p>
        </div>
      </Section>

      {/* High School Track - Light blue strip */}
      <section className="w-full py-12 md:py-16 bg-blue-500/10 backdrop-blur-md border-y border-blue-400/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-white">
              High School & Pre-University Pathways
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-semibold mb-4 text-white">Common Scenarios</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-blue-400" />
                    <span>Unsure which university course to choose</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-blue-400" />
                    <span>Need help with application strategy</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-blue-400" />
                    <span>Want to explore career options early</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-blue-400" />
                    <span>Parents seeking guidance for their child</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-4 text-white">What We Do</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-blue-400" />
                    <span>Assess interests, strengths, and goals</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-blue-400" />
                    <span>Research and recommend course options</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-blue-400" />
                    <span>Develop application strategy</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-blue-400" />
                    <span>Create a pathway plan</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-4 text-white">Typical Deliverables</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-blue-400" />
                    <span>Course recommendation report</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-blue-400" />
                    <span>Application timeline and checklist</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-blue-400" />
                    <span>Master Document (pathway plan)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-blue-400" />
                    <span>Action items and next steps</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* University Track - Navy background */}
      <Section className="py-12 md:py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-white">
            University & Early Career
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-4 text-white">Common Scenarios</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <div className="mr-2 mt-0.5 flex-shrink-0 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 blur-sm opacity-40"></div>
                    <CheckCircle className="h-5 w-5 relative text-amber-400" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' }} />
                  </div>
                  <span>Applying for internships</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-0.5 flex-shrink-0 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 blur-sm opacity-40"></div>
                    <CheckCircle className="h-5 w-5 relative text-amber-400" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' }} />
                  </div>
                  <span>Seeking graduate roles</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-0.5 flex-shrink-0 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 blur-sm opacity-40"></div>
                    <CheckCircle className="h-5 w-5 relative text-amber-400" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' }} />
                  </div>
                  <span>Uncertain about career direction</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-0.5 flex-shrink-0 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 blur-sm opacity-40"></div>
                    <CheckCircle className="h-5 w-5 relative text-amber-400" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' }} />
                  </div>
                  <span>Need help positioning yourself</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-white">What We Do</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <div className="mr-2 mt-0.5 flex-shrink-0 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 blur-sm opacity-40"></div>
                    <CheckCircle className="h-5 w-5 relative text-amber-400" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' }} />
                  </div>
                  <span>Evaluate your skills and experience</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-0.5 flex-shrink-0 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 blur-sm opacity-40"></div>
                    <CheckCircle className="h-5 w-5 relative text-amber-400" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' }} />
                  </div>
                  <span>Identify target roles and companies</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-0.5 flex-shrink-0 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 blur-sm opacity-40"></div>
                    <CheckCircle className="h-5 w-5 relative text-amber-400" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' }} />
                  </div>
                  <span>Develop positioning strategy</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-0.5 flex-shrink-0 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 blur-sm opacity-40"></div>
                    <CheckCircle className="h-5 w-5 relative text-amber-400" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' }} />
                  </div>
                  <span>Create application action plan</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-white">Typical Deliverables</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <div className="mr-2 mt-0.5 flex-shrink-0 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 blur-sm opacity-40"></div>
                    <CheckCircle className="h-5 w-5 relative text-amber-400" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' }} />
                  </div>
                  <span>Target role and company list</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-0.5 flex-shrink-0 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 blur-sm opacity-40"></div>
                    <CheckCircle className="h-5 w-5 relative text-amber-400" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' }} />
                  </div>
                  <span>Positioning framework</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-0.5 flex-shrink-0 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 blur-sm opacity-40"></div>
                    <CheckCircle className="h-5 w-5 relative text-amber-400" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' }} />
                  </div>
                  <span>Master Document (career plan)</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-0.5 flex-shrink-0 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 blur-sm opacity-40"></div>
                    <CheckCircle className="h-5 w-5 relative text-amber-400" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' }} />
                  </div>
                  <span>Application strategy and timeline</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* CTA - Light blue strip */}
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

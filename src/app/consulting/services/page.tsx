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
  const h1Class = 'text-4xl md:text-5xl font-bold text-slate-900 dark:text-white';
  const h2Class = 'text-3xl md:text-4xl font-bold text-slate-900 dark:text-white';
  const h3Class = 'text-xl font-semibold text-slate-900 dark:text-white';
  const bodyClass = 'text-slate-700 dark:text-slate-200';
  const accentClass = 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent';
  const stripClass = 'bg-slate-100 dark:bg-slate-800/60 border-y border-slate-200 dark:border-slate-700/50';
  const iconBlueClass = 'text-blue-600 dark:text-blue-400';
  const iconAmberClass = 'text-amber-600 dark:text-amber-400';

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero */}
      <Section className="pt-12 pb-16 md:pt-16 md:pb-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className={`${h1Class} mb-6`}>
            Our <span className={accentClass}>Services</span>
          </h1>
          <p className={`text-xl ${bodyClass}`}>
            Two specialized tracks designed for your stage of career development
          </p>
        </div>
      </Section>

      {/* High School Track */}
      <section className={`w-full py-12 md:py-16 ${stripClass}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <h2 className={`${h2Class} mb-8`}>
              High School & Pre-University Pathways
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className={`${h3Class} mb-4`}>Common Scenarios</h3>
                <ul className={`space-y-2 ${bodyClass}`}>
                  <li className="flex items-start">
                    <CheckCircle className={`h-5 w-5 mr-2 mt-0.5 flex-shrink-0 ${iconBlueClass}`} />
                    <span>Unsure which university course to choose</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className={`h-5 w-5 mr-2 mt-0.5 flex-shrink-0 ${iconBlueClass}`} />
                    <span>Need help with application strategy</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className={`h-5 w-5 mr-2 mt-0.5 flex-shrink-0 ${iconBlueClass}`} />
                    <span>Want to explore career options early</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className={`h-5 w-5 mr-2 mt-0.5 flex-shrink-0 ${iconBlueClass}`} />
                    <span>Parents seeking guidance for their child</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className={`${h3Class} mb-4`}>What We Do</h3>
                <ul className={`space-y-2 ${bodyClass}`}>
                  <li className="flex items-start">
                    <CheckCircle className={`h-5 w-5 mr-2 mt-0.5 flex-shrink-0 ${iconBlueClass}`} />
                    <span>Assess interests, strengths, and goals</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className={`h-5 w-5 mr-2 mt-0.5 flex-shrink-0 ${iconBlueClass}`} />
                    <span>Research and recommend course options</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className={`h-5 w-5 mr-2 mt-0.5 flex-shrink-0 ${iconBlueClass}`} />
                    <span>Develop application strategy</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className={`h-5 w-5 mr-2 mt-0.5 flex-shrink-0 ${iconBlueClass}`} />
                    <span>Create a pathway plan</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className={`${h3Class} mb-4`}>Typical Deliverables</h3>
                <ul className={`space-y-2 ${bodyClass}`}>
                  <li className="flex items-start">
                    <CheckCircle className={`h-5 w-5 mr-2 mt-0.5 flex-shrink-0 ${iconBlueClass}`} />
                    <span>Course recommendation report</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className={`h-5 w-5 mr-2 mt-0.5 flex-shrink-0 ${iconBlueClass}`} />
                    <span>Application timeline and checklist</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className={`h-5 w-5 mr-2 mt-0.5 flex-shrink-0 ${iconBlueClass}`} />
                    <span>Master Document (pathway plan)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className={`h-5 w-5 mr-2 mt-0.5 flex-shrink-0 ${iconBlueClass}`} />
                    <span>Action items and next steps</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* University Track */}
      <Section className="py-12 md:py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className={`${h2Class} mb-8`}>
            University & Early Career
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div>
                <h3 className={`${h3Class} mb-4`}>Common Scenarios</h3>
              <ul className={`space-y-2 ${bodyClass}`}>
                <li className="flex items-start">
                  <CheckCircle className={`h-5 w-5 mr-2 mt-0.5 flex-shrink-0 ${iconAmberClass}`} />
                  <span>Applying for internships</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className={`h-5 w-5 mr-2 mt-0.5 flex-shrink-0 ${iconAmberClass}`} />
                  <span>Seeking graduate roles</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className={`h-5 w-5 mr-2 mt-0.5 flex-shrink-0 ${iconAmberClass}`} />
                  <span>Uncertain about career direction</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className={`h-5 w-5 mr-2 mt-0.5 flex-shrink-0 ${iconAmberClass}`} />
                  <span>Need help positioning yourself</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className={`${h3Class} mb-4`}>What We Do</h3>
              <ul className={`space-y-2 ${bodyClass}`}>
                <li className="flex items-start">
                  <CheckCircle className={`h-5 w-5 mr-2 mt-0.5 flex-shrink-0 ${iconAmberClass}`} />
                  <span>Evaluate your skills and experience</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className={`h-5 w-5 mr-2 mt-0.5 flex-shrink-0 ${iconAmberClass}`} />
                  <span>Identify target roles and companies</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className={`h-5 w-5 mr-2 mt-0.5 flex-shrink-0 ${iconAmberClass}`} />
                  <span>Develop positioning strategy</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className={`h-5 w-5 mr-2 mt-0.5 flex-shrink-0 ${iconAmberClass}`} />
                  <span>Create application action plan</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className={`${h3Class} mb-4`}>Typical Deliverables</h3>
              <ul className={`space-y-2 ${bodyClass}`}>
                <li className="flex items-start">
                  <CheckCircle className={`h-5 w-5 mr-2 mt-0.5 flex-shrink-0 ${iconAmberClass}`} />
                  <span>Target role and company list</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className={`h-5 w-5 mr-2 mt-0.5 flex-shrink-0 ${iconAmberClass}`} />
                  <span>Positioning framework</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className={`h-5 w-5 mr-2 mt-0.5 flex-shrink-0 ${iconAmberClass}`} />
                  <span>Master Document (career plan)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className={`h-5 w-5 mr-2 mt-0.5 flex-shrink-0 ${iconAmberClass}`} />
                  <span>Application strategy and timeline</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* CTA */}
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


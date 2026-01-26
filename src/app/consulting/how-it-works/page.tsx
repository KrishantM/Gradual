import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Section from '@/components/consulting/Section';
import { ArrowRight, FileText, Clock, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'How it Works - Gradual Consulting',
  description: 'Learn about our structured 5-stage consulting process designed to deliver clarity and actionable outcomes.',
};

export default function HowItWorksPage() {
  const stages = [
    {
      number: 1,
      title: 'Direction and Role Targeting',
      description: 'We define clear direction. We identify the roles or pathways that make sense for you based on your background, strengths, interests, and constraints. The focus is on realistic, high-value options so your effort is spent where it matters. You leave with a clear target and a reasoned plan.',
    },
    {
      number: 2,
      title: 'Candidate and Market Gap Analysis',
      description: 'We assess how you compare to the market. Your experience, skills, and profile are benchmarked against what employers or institutions are actually looking for. We identify gaps, risks, and areas of competitive advantage. This removes guesswork and shows exactly what needs improvement.',
    },
    {
      number: 3,
      title: 'Positioning, USP, and Career Narrative',
      description: 'We refine how you are positioned. This stage focuses on your messaging across CVs, applications, LinkedIn, and interviews. We define your strengths, sharpen your narrative, and align your profile with your target outcomes. You move from generic to intentional.',
    },
    {
      number: 4,
      title: 'Applications and Interview Execution',
      description: 'We support execution. This includes application and CV reviews, interview preparation, and real-time adjustments based on results. Support is practical and responsive as you move through the process.',
    },
    {
      number: 5,
      title: 'Execution, Feedback, and Offer Strategy',
      description: 'We optimise based on outcomes. We review feedback, refine strategy where needed, and help you assess opportunities or offers in the context of your longer-term goals. The aim is not just progress, but the right progress.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black">
      {/* Hero */}
      <Section className="pt-12 pb-16 md:pt-16 md:pb-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            <span className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 bg-clip-text text-transparent">How</span> Gradual Consulting Works
          </h1>
          <p className="text-xl text-gray-300 mb-4">
            Gradual Consulting uses a structured, outcomes-focused framework to help you make clear career decisions and execute them effectively.
          </p>
          <p className="text-lg text-gray-400">
            The framework adapts to your stage, whether you are choosing pathways, preparing for your first role, or navigating early-career job applications.
          </p>
        </div>
      </Section>

      {/* Process Stages - Light blue strip */}
      <section className="w-full py-12 md:py-16 bg-blue-500/10 backdrop-blur-md border-y border-blue-400/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-semibold mb-8 text-center text-white">
              The Gradual Career Consulting Framework
            </h2>
            <div className="space-y-12">
              {stages.map((stage, index) => (
                <div key={stage.number} className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full text-white flex items-center justify-center font-bold text-xl bg-blue-600">
                      {stage.number}
                    </div>
                    {index < stages.length - 1 && (
                      <div className="w-0.5 h-12 mx-auto mt-4 bg-white/20"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-12">
                    <h2 className="text-2xl font-bold mb-3 text-white">
                      {stage.title}
                    </h2>
                    <p className="leading-relaxed text-gray-300">
                      {stage.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Session Cadence - Navy background */}
      <Section className="py-12 md:py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-white">
            Sessions and Support
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Clock className="h-6 w-6 mr-3 text-blue-400" />
                  <h3 className="text-xl font-semibold text-white">Session Format</h3>
                </div>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Sessions typically run for 60 to 90 minutes and are conducted via video call. Scheduling is flexible and depends on your selected package.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  Each session includes clear follow-up notes and action items to ensure momentum continues between sessions.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="mr-3 relative inline-block">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 blur-sm opacity-40"></div>
                    <FileText className="h-6 w-6 relative text-amber-400" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' }} />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Between Sessions</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  Between sessions, you will work through agreed action items. Support may include email check-ins for quick questions, document review and feedback where needed, and preparation for the next session.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Section>

      {/* Master Document - Light blue strip */}
      <section className="w-full py-12 md:py-16 bg-blue-500/10 backdrop-blur-md border-y border-blue-400/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-lg rounded-2xl">
              <CardContent className="p-8">
                <div className="flex items-start mb-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full text-white flex items-center justify-center mr-4 bg-blue-600">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-3 text-white">
                      The Master Document
                    </h2>
                    <p className="leading-relaxed mb-4 text-gray-300">
                      At the conclusion of your consulting engagement, you will receive a concise Master Document, typically one to two pages in length.
                    </p>
                    <p className="leading-relaxed mb-4 text-gray-300">
                      This document brings together:
                    </p>
                    <ul className="space-y-2 text-gray-300 mb-4">
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-blue-400" />
                        <span>Your agreed direction and strategy</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mr-2 mt-0.5 flex-shrink-0 relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 blur-sm opacity-40"></div>
                          <CheckCircle className="h-5 w-5 relative text-amber-400" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' }} />
                        </div>
                        <span>Key positioning points and messaging</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-blue-400" />
                        <span>Identified gaps and priorities</span>
                      </li>
                      <li className="flex items-start">
                        <div className="mr-2 mt-0.5 flex-shrink-0 relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 blur-sm opacity-40"></div>
                          <CheckCircle className="h-5 w-5 relative text-amber-400" style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' }} />
                        </div>
                        <span>Clear next steps and recommendations</span>
                      </li>
                    </ul>
                    <p className="leading-relaxed text-gray-300">
                      The Master Document is designed to be a practical reference you can return to as you continue your career journey independently.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA - Navy background */}
      <Section>
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
      </Section>
    </div>
  );
}

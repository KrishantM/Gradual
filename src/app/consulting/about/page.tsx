import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Section from '@/components/consulting/Section';
import { CheckCircle, ArrowRight, Briefcase, Target } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About - Gradual Consulting',
  description: 'Learn about the background and approach behind Gradual Consulting.',
};

export default function AboutPage() {
  const beliefs = [
    {
      icon: Target,
      title: 'Practicality',
      description: 'We focus on actionable strategies and real-world outcomes, not abstract concepts.',
    },
    {
      icon: CheckCircle,
      title: 'Clarity',
      description: 'Complex career decisions become clear when broken down into structured steps.',
    },
    {
      icon: Briefcase,
      title: 'Accountability',
      description: 'We provide the framework, but you own the execution. We\'re here to guide and support.',
    },
  ];

  const h1Class = 'text-4xl md:text-5xl font-bold text-slate-900 dark:text-white';
  const h2Class = 'text-3xl font-bold text-slate-900 dark:text-white';
  const bodyClass = 'text-slate-700 dark:text-slate-200';
  const accentClass = 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent';
  const stripClass = 'bg-slate-100 dark:bg-slate-800/60 border-y border-slate-200 dark:border-slate-700/50';
  const iconClass = 'text-blue-600 dark:text-blue-400';
  const iconAmberClass = 'text-amber-600 dark:text-amber-400';

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero */}
      <Section className="pt-12 pb-16 md:pt-16 md:pb-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className={`${h1Class} mb-6`}>
            About Gradual <span className={accentClass}>Consulting</span>
          </h1>
          <p className={`text-xl ${bodyClass}`}>
            Professional career guidance built on real-world experience
          </p>
        </div>
      </Section>

      {/* Bio Section */}
      <section className={`w-full py-12 md:py-16 ${stripClass}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <h2 className={`${h2Class} mb-6`}>
              Background
            </h2>
            <div className={`${bodyClass} leading-relaxed space-y-4`}>
              <p>
                Gradual Consulting is built on a practical understanding of how to navigate education and early careers strategically, without relying on privileged pathways or unnecessary detours.
              </p>
              <p>
                My own path followed this philosophy closely. I completed my NCEA qualifications a year early with strong results, skipped my final year of high school, and moved directly into a three-year university degree. By focusing on the right decisions at each stage, I was able to secure a graduate role in Big 4 consulting immediately after university and begin working in a professional corporate environment at age 20.
              </p>
              <p>
                There was nothing extraordinary or inaccessible about this path. It was the result of understanding the system, making informed trade-offs, and consistently optimising each step from subject selection to degree choice to job applications. That experience shapes how I think about careers and progression.
              </p>
              <p>
                Alongside my corporate role, I have worked extensively with students and early-career professionals across different stages, including high school, university, and the graduate job search. Through this, I have seen how often capable people delay progress not due to lack of ability, but due to unclear strategy, misaligned decisions, or poor information.
              </p>
              <p>
                My focus is helping people understand how to work with what they already have and make the most effective decisions available to them. You do not need elite schools, top-tier internships, or extended degrees to reach strong outcomes. With the right structure and strategy, progress can be made earlier and more efficiently.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What I Believe */}
      <Section className="py-12 md:py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-slate-900 dark:text-white">
            What I Believe
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {beliefs.map((belief, index) => {
              const Icon = belief.icon;
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-white/10 mb-4">
                    <Icon className={`h-8 w-8 ${index === 1 ? iconAmberClass : iconClass}`} />
                  </div>
                  <h3 className="font-semibold mb-2 text-lg text-slate-900 dark:text-white">
                    {belief.title}
                  </h3>
                  <p className={`text-sm leading-relaxed ${bodyClass}`}>
                    {belief.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* Approach */}
      <section className={`w-full py-12 md:py-16 ${stripClass}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <h2 className={`${h2Class} mb-6`}>
              My Approach
            </h2>
            <div className={`space-y-4 ${bodyClass} leading-relaxed`}>
              <p>
                My approach to career consulting is grounded directly in experience and structured thinking. I do not offer generic advice or one-size-fits-all guidance.
              </p>
              <p>
                Every engagement starts with a top-down, holistic assessment. We look at where you are now, where you want to go, and how your current actions align with that goal. From there, we identify gaps, inefficiencies, and opportunities, then determine the most direct and realistic path forward.
              </p>
              <p>
                The process is analytical and outcome-focused. I prioritise clarity, decision-making, and execution over theory. This means asking the right questions, challenging assumptions, and providing honest, practical feedback based on how hiring processes and career pathways actually work.
              </p>
              <p>
                At the same time, the approach is highly personal. Each individual has different strengths, constraints, timelines, and risk tolerance. Your plan is tailored to those factors rather than forcing you into a predefined model.
              </p>
              <p>
                A key outcome of this process is the master document, a structured and practical summary of insights, strategy, and next steps. This document is designed to be a persisting resource you can return to as you progress, adapt, and make future decisions.
              </p>
              <p>
                The goal is simple: to help you reach your core objectives as efficiently and confidently as possible, with a clear strategy guiding each step along the way.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <Section>
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
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
      </Section>
    </div>
  );
}


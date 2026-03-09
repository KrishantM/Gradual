import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import Section from '@/components/consulting/Section';
import FAQAccordion from '@/components/consulting/FAQAccordion';
import { CheckCircle, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pricing - Gradual Consulting',
  description: 'Flexible pricing packages for career consulting. Choose from single sessions, starter packs, or full pathway programs.',
};

export default function PricingPage() {
  const packages = [
    {
      name: 'Single Session',
      price: '$55',
      priceUnit: 'NZD',
      description: 'Perfect for a focused consultation on a specific topic',
      features: [
        'One 60-90 minute session',
        'Focused discussion on your specific needs',
        'Follow-up notes and action items',
        'Email support for 2 weeks after session',
      ],
      cta: 'Book a session',
    },
    {
      name: 'Triple Session',
      price: '$50',
      priceUnit: 'NZD',
      priceNote: 'per session',
      description: 'Three sessions to get you started on the right path',
      features: [
        'Three 60-90 minute sessions',
        'Structured 3-stage process',
        'Strategic plan development',
        'Follow-up notes after each session',
        'Email support throughout',
      ],
      popular: true,
      cta: 'Get started',
    },
    {
      name: 'Full Pathway',
      price: '$45',
      priceUnit: 'NZD',
      priceNote: 'per session',
      description: 'Complete 5-stage process with Master Document',
      features: [
        'Five 60-90 minute sessions',
        'Complete 5-stage process',
        'Master Document (1-2 pages)',
        'Comprehensive strategic plan',
        'Ongoing email support',
        'Document review and feedback',
      ],
      cta: 'Start your pathway',
    },
  ];

  const faqs = [
    {
      question: 'Can I reschedule a session?',
      answer: 'Yes, we understand that schedules can change. Please provide at least 24 hours notice to reschedule, and we\'ll work with you to find a new time that works.',
    },
    {
      question: 'Can parents pay for sessions?',
      answer: 'Absolutely. Many parents invest in consulting services for their children. We can arrange payment and billing to accommodate this. Please mention this when booking.',
    },
    {
      question: 'What should I prepare before my first session?',
      answer: 'Before your first session, think about your goals, current situation, and any specific questions or challenges you\'d like to address. We\'ll send you a brief preparation guide once you book. For anything specific you might want to cover, you can include it in your contact email or mention it in your fit check call, and we can plan ahead for you.',
    },
    {
      question: 'What happens if I need more sessions?',
      answer: 'You can always add additional sessions to your package. We\'re flexible and can work with you to create a custom arrangement that fits your needs.',
    },
  ];

  const h1Class = 'text-4xl md:text-5xl font-bold text-slate-900 dark:text-white';
  const h2Class = 'text-3xl md:text-4xl font-bold text-slate-900 dark:text-white';
  const titleClass = 'text-2xl font-semibold text-slate-900 dark:text-white';
  const bodyClass = 'text-slate-700 dark:text-slate-200';
  const accentClass = 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent';
  const cardBaseClass = 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 shadow-lg';

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero */}
      <Section className="pt-12 pb-16 md:pt-16 md:pb-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className={`${h1Class} mb-6`}>
            <span className={accentClass}>Pricing</span>
          </h1>
          <p className={`text-xl ${bodyClass}`}>
            Flexible packages designed to meet you where you are
          </p>
        </div>
      </Section>

      {/* Packages */}
      <Section className="pt-8 pb-16 md:pt-12 md:pb-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {packages.map((pkg, index) => (
            <Card
              key={index}
              className={`${cardBaseClass} ${pkg.popular ? 'border-2 border-blue-500 dark:border-blue-400/50 relative' : ''}`}
            >
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className={titleClass}>{pkg.name}</CardTitle>
                <CardDescription className={`text-base mt-2 ${bodyClass}`}>
                  {pkg.description}
                </CardDescription>
                <div className="mt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-slate-900 dark:text-white">{pkg.price}</span>
                    <span className={`text-lg ${bodyClass}`}>{pkg.priceUnit}</span>
                    {pkg.priceNote && (
                      <span className="text-sm text-slate-500 dark:text-slate-400 ml-1">{pkg.priceNote}</span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className={`space-y-3 ${bodyClass}`}>
                  {pkg.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Link href="/consulting/contact" className="w-full">
                  <Button
                    className={`w-full ${
                      pkg.popular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white border border-slate-200 dark:border-white/20 hover:bg-slate-200 dark:hover:bg-white/20'
                    }`}
                  >
                    {pkg.cta}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section>
        <div className="max-w-5xl mx-auto">
          <h2 className={`${h2Class} mb-8 text-center`}>
            Frequently Asked <span className={accentClass}>Questions</span>
          </h2>
          <FAQAccordion items={faqs} />
        </div>
      </Section>

      {/* CTA */}
      <Section>
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
      </Section>
    </div>
  );
}


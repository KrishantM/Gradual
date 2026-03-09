'use client';

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Section from '@/components/consulting/Section';
import { ArrowRight, CheckCircle, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    track: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/consulting-lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      setIsSubmitted(true);
      setFormData({ name: '', email: '', track: '', message: '' });
      
      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);
    } catch (err) {
      setError('Something went wrong. Please try again or email us directly.');
      console.error('Form submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const h1Class = 'text-4xl md:text-5xl font-bold text-slate-900 dark:text-white';
  const bodyClass = 'text-slate-700 dark:text-slate-200';
  const accentClass = 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent';
  const cardClass = 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 shadow-lg';
  const inputClass = 'bg-white dark:bg-white/10 border-slate-200 dark:border-white/20 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400';

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero */}
      <Section className="pt-12 pb-16 md:pt-16 md:pb-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className={`${h1Class} mb-6`}>
            Get in <span className={accentClass}>Touch</span>
          </h1>
          <p className={`text-xl ${bodyClass}`}>
            Book a free 10-minute fit check or send us a message
          </p>
        </div>
      </Section>

      {/* Contact Form & Booking */}
      <Section>
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className={cardClass}>
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Send us a message</CardTitle>
                <CardDescription className={bodyClass}>
                  Fill out the form below and we&apos;ll get back to you within 24 hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isSubmitted ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                      Thank you for your message!
                    </p>
                    <p className={bodyClass}>
                      We&apos;ll get back to you within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="name" className={`block text-sm font-medium ${bodyClass} mb-1`}>
                        Name *
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className={`w-full ${inputClass}`}
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className={`block text-sm font-medium ${bodyClass} mb-1`}>
                        Email *
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full ${inputClass}`}
                        placeholder="your.email@example.com"
                      />
                    </div>
                    <div>
                      <label htmlFor="track" className={`block text-sm font-medium ${bodyClass} mb-1`}>
                        Track *
                      </label>
                      <select
                        id="track"
                        name="track"
                        required
                        value={formData.track}
                        onChange={handleChange}
                        className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] ${inputClass}`}
                      >
                        <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Select a track</option>
                        <option value="high-school" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">High School & Pre-University Pathways</option>
                        <option value="university" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">University & Early Career</option>
                        <option value="not-sure" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Not sure yet</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="message" className={`block text-sm font-medium ${bodyClass} mb-1`}>
                        Message *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        value={formData.message}
                        onChange={handleChange}
                        rows={4}
                        className={`flex w-full rounded-md border px-3 py-2 text-sm placeholder:text-slate-500 dark:placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] ${inputClass}`}
                        placeholder="Tell us about your situation and what you'd like help with..."
                      />
                    </div>
                    {error && (
                      <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
                    )}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 text-white hover:bg-blue-700"
                    >
                      {isSubmitting ? 'Sending...' : 'Send message'}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            <Card className={cardClass}>
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Book a call</CardTitle>
                <CardDescription className={bodyClass}>
                  Schedule a free 10-minute fit check to see if we&apos;re a good match.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center mb-4">
                      <Calendar className="h-6 w-6 mr-3 text-blue-600 dark:text-blue-400" />
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Quick Booking
                      </h3>
                    </div>
                    <p className={`${bodyClass} mb-4`}>
                      Use the button below to access our booking calendar. You can select a time that works for you.
                    </p>
                    <Button
                      className="w-full bg-blue-600 text-white hover:bg-blue-700"
                      onClick={() => {
                        const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || 'https://calendly.com/admin-gradual/30min';
                        window.open(calendlyUrl, '_blank');
                      }}
                    >
                      <Calendar className="mr-2 h-5 w-5" />
                      Book a free 10-min fit check
                    </Button>
                  </div>
                  <div className="pt-6 border-t border-slate-200 dark:border-slate-700/50">
                    <h3 className="font-semibold mb-2 text-slate-900 dark:text-white">
                      What to expect
                    </h3>
                    <ul className={`space-y-2 text-sm ${bodyClass}`}>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                        <span>10-minute conversation about your needs</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                        <span>Discussion of how we can help</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                        <span>No pressure, just a friendly chat</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Section>

      {/* Additional Info */}
      <Section>
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
            Other ways to reach us
          </h2>
          <p className={`${bodyClass} mb-6`}>
            Prefer email? Send us a message at{' '}
            <a href="mailto:admin@gradual.co.nz" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
              admin@gradual.co.nz
            </a>
          </p>
          <Link href="/consulting/pricing">
            <Button variant="ghost" className={`${bodyClass} hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10`}>
              View pricing packages
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </Section>
    </div>
  );
}


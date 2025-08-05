'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wrench, Clock, Mail, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export default function MaintenancePage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    const normalizedEmail = email.trim().toLowerCase();
  
    try {
      // Send to our API route which handles both Firestore and MailerLite
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email: normalizedEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error) {
          alert(data.error);
        } else {
          alert("Oops! Something went wrong. Please try again.");
        }
        return;
      }

      // Reset UI
      setIsSubmitted(true);
      setName("");
      setEmail("");
      setTimeout(() => setIsSubmitted(false), 3000);
  
    } catch (err) {
      console.error("Error during waitlist submission:", err);
      alert("Oops! Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black flex items-center justify-center py-20">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
          <CardContent className="p-12 text-center">
            {/* Logo */}
            <div className="mb-8 flex justify-center">
              <Image 
                src="/newlogo2.png" 
                alt="Gradual" 
                width={200}
                height={200}
                priority
                unoptimized
                className="h-16 w-auto"
                style={{ objectFit: 'contain' }}
              />
            </div>

            {/* Maintenance Icon */}
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Wrench className="h-10 w-10 text-blue-400" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              We&apos;re Making Gradual Better
            </h1>

            {/* Description */}
            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
              We&apos;re currently performing some maintenance to improve your experience. 
              We&apos;ll be back soon with enhanced features and better performance.
            </p>

            {/* Status */}
            <div className="flex items-center justify-center mb-8 text-blue-400">
              <Clock className="h-5 w-5 mr-2" />
              <span className="font-medium">Expected completion: Soon</span>
            </div>

            {/* Waitlist Form */}
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-400/30 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-white mb-3">
                Stay Updated
              </h2>
              <p className="text-gray-300 mb-6">
                Join our waitlist to be notified when we&apos;re back online with all the new features!
              </p>

              {isSubmitted ? (
                <div className="text-center py-4">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <p className="text-green-400 text-lg font-medium">Thanks for joining! We&apos;ll be in touch soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
                  />
                  <Input
                    type="email"
                    placeholder="Your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
                  />
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 rounded-lg transition-all duration-300"
                  >
                    <Mail className="h-5 w-5 mr-2" />
                    Join Waitlist
                  </Button>
                </form>
              )}
            </div>

            {/* Contact */}
            <div className="text-gray-400 text-sm">
              <p>Questions? Contact us at{' '}
                <a href="mailto:admin@gradual.co.nz" className="text-blue-400 hover:text-blue-300 underline">
                  admin@gradual.co.nz
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
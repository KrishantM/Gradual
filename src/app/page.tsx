"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Brain, Target, BarChart3, Users, ArrowRight, CheckCircle, TrendingUp } from "lucide-react"
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Image from "next/image"

export default function LandingPage() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
  
    const normalizedEmail = email.trim().toLowerCase()
  
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
      setIsSubmitted(true)
      setName("")
      setEmail("")
      setTimeout(() => setIsSubmitted(false), 3000)
  
    } catch (err) {
      console.error("Error during waitlist submission:", err)
      alert("Oops! Something went wrong. Please try again.")
    }
  }

  const features = [
    {
      icon: TrendingUp,
      title: "AI-driven CV scoring",
      description:
        "Get instant feedback on your resume with our advanced AI that analyzes content, structure, and relevance to help you stand out.",
    },
    {
      icon: Brain,
      title: "Smart role suggestions",
      description:
        "Discover opportunities tailored to your skills, experience, and career aspirations through intelligent matching and personalized recommendations.",
    },
    {
      icon: BarChart3,
      title: "Personalized dashboard",
      description:
        "Track your progress, manage applications, and visualize your career journey with an all-in-one dashboard.",
    },
    {
      icon: Users,
      title: "Built for everyone",
      description:
        "Whether you're a student, graduate, or recruiter, our platform adapts to your unique needs and goals.",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10" />
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo */}
            <div className="mb-8 flex justify-center">
              <Image 
                src="/newlogo2.png" 
                alt="Gradual" 
                width={200}
                height={200}
                priority
                unoptimized
                className="h-12 md:h-16 lg:h-20 w-auto"
                style={{ objectFit: 'contain' }}
              />
            </div>

            {/* Tagline */}
            <h2 className="text-2xl lg:text-4xl font-light text-gray-200 mb-8 leading-tight">
              Your Future,{" "}
              <span className="font-semibold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Curated.
              </span>
            </h2>

            {/* CTA Button */}
            <Button
              size="lg"
              className="mb-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-8 py-4 text-lg rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })}
            >
              Join the Waitlist
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            {/* Subheading */}
            <p className="text-gray-400 text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed">
              Join the waitlist now and get early access as we put the finishing touches on Gradual.
            </p>
          </div>
        </div>
      </section>

      {/* Waitlist Form Section */}
      <section id="waitlist" className="py-20 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
              <CardContent className="p-8">
                <h3 className="text-2xl font-semibold text-white mb-6 text-center">Join the Waitlist</h3>

                {isSubmitted ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                    <p className="text-green-400 text-lg font-medium">Thanks for joining! We&apos;ll be in touch soon.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
                    />
                    <Input
                      type="email"
                      placeholder="Your email"
                      value={email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
                    />
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 rounded-lg transition-all duration-300"
                    >
                      Get Early Access
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              What is <span className="text-blue-400">Gradual</span>?
            </h3>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              An intelligent platform that helps students and professionals land the right roles faster
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 transition-all duration-300 transform hover:scale-105 hover:shadow-xl group"
              >
                <CardContent className="p-6 text-center">
                  <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition-all duration-300">
                    <feature.icon className="h-8 w-8 text-blue-400 group-hover:text-blue-300 transition-colors duration-300" />
                  </div>
                  <h4 className="text-xl font-semibold text-white mb-3">{feature.title}</h4>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
} 
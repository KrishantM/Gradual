"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Brain, Target, BarChart3, Users, ArrowRight, CheckCircle } from "lucide-react"
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import emailjs from "@emailjs/browser"

export default function LandingPage() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
  
    const normalizedEmail = email.trim().toLowerCase()
  
    try {
      // 1. Check for duplicate
      const q = query(collection(db, "waitlist"), where("email", "==", normalizedEmail))
      const existing = await getDocs(q)
  
      if (!existing.empty) {
        alert("You're already on the waitlist. We'll be in touch soon!")
        setIsSubmitted(true)
        return
      }
  
      // 2. Save to Firestore
      await addDoc(collection(db, "waitlist"), {
        name,
        email: normalizedEmail,
        submittedAt: serverTimestamp(),
      })
  
      // 3. Send email using EmailJS
      await emailjs.send(
        "NXT_Waitlist",    // e.g., service_6aq1c1a
        "template_29837za",   // e.g., template_vyb2f4m
        {
          user_name: name,
          email: normalizedEmail,
        },
        "yZVQJAf_JS1Bm3-JS"     // e.g., oD3hTQyGzH2zjk12x
      )
  
      // 4. Reset UI
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
      icon: Brain,
      title: "AI-driven CV scoring",
      description:
        "Get instant feedback on your resume with our advanced AI algorithms that analyze content, structure, and relevance.",
    },
    {
      icon: Target,
      title: "Smart role suggestions",
      description:
        "Discover opportunities tailored to your skills, experience, and career aspirations through intelligent matching.",
    },
    {
      icon: BarChart3,
      title: "Personalized dashboard",
      description:
        "Track your progress, manage applications, and visualize your career journey with comprehensive analytics.",
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

            <div className="mb-8">
              <h1 className="text-4xl lg:text-6xl font-bold text-white">
                Gradual
              </h1>
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
              Get early access to AI-powered career insights and tailored role suggestions.
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
              Why Choose Gradual?
            </h3>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Powerful AI-driven tools designed to accelerate your career journey
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

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 bg-black/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h4 className="text-2xl font-bold text-white">
                Gradual
              </h4>
            </div>
            <nav className="flex space-x-8">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors duration-300 hover:underline underline-offset-4"
              >
                Terms
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors duration-300 hover:underline underline-offset-4"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors duration-300 hover:underline underline-offset-4"
              >
                Contact
              </a>
            </nav>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center">
            <p className="text-gray-500">© 2025 Gradual. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
} 
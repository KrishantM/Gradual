"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Brain, Target, BarChart3, Users, ArrowRight, CheckCircle, TrendingUp, Sparkles, Star } from "lucide-react"
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Image from "next/image"
import { motion, useAnimation, useInView } from "framer-motion"
import { useRef } from "react"

// Animated components
const AnimatedText = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const controls = useAnimation()

  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    }
  }, [isInView, controls])

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const GradientText = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const controls = useAnimation()

  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    }
  }, [isInView, controls])

  return (
    <motion.span
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { 
          opacity: 0, 
          x: -100,
          backgroundPosition: "-200% 0"
        },
        visible: { 
          opacity: 1, 
          x: 0,
          backgroundPosition: "200% 0"
        }
      }}
      transition={{ 
        duration: 1.5, 
        delay,
        ease: "easeOut"
      }}
      className="font-semibold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent bg-[length:200%_100%]"
    >
      {children}
    </motion.span>
  )
}

const FloatingCard = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const controls = useAnimation()

  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    }
  }, [isInView, controls])

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 50, scale: 0.9 },
        visible: { opacity: 1, y: 0, scale: 1 }
      }}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
      whileHover={{ 
        y: -10, 
        scale: 1.02,
        transition: { duration: 0.3 }
      }}
      className="group"
    >
      {children}
    </motion.div>
  )
}

export default function LandingPage() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

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
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10" />
        <motion.div 
          className="absolute top-20 left-10 w-20 h-20 bg-blue-400/20 rounded-full blur-xl"
          animate={{ 
            y: [0, -20, 0],
            x: [0, 10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute top-40 right-20 w-32 h-32 bg-purple-400/20 rounded-full blur-xl"
          animate={{ 
            y: [0, 30, 0],
            x: [0, -15, 0],
            scale: [1, 0.9, 1]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        <motion.div 
          className="absolute bottom-20 left-1/4 w-16 h-16 bg-cyan-400/20 rounded-full blur-xl"
          animate={{ 
            y: [0, -25, 0],
            x: [0, 20, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />

        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo */}
            <motion.div 
              className="mb-8 flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Image 
                src="/newlogo2.png" 
                alt="Gradual" 
                width={200}
                height={200}
                priority
                unoptimized
                className="h-12 md:h-16 lg:h-20 w-auto drop-shadow-2xl"
                style={{ objectFit: 'contain' }}
              />
            </motion.div>

            {/* Tagline with special animation */}
            <motion.h2 
              className="text-2xl lg:text-4xl font-light text-gray-200 mb-8 leading-tight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <AnimatedText delay={0.5}>
                Your Future,{" "}
              </AnimatedText>
              <GradientText delay={1.2}>
                Curated.
              </GradientText>
            </motion.h2>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.8 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-8 py-4 text-lg rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover-lift"
                  onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })}
                >
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Join the Waitlist
                  </motion.span>
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 font-semibold px-8 py-4 text-lg rounded-full transition-all duration-300 hover-lift"
                  onClick={() => window.location.href = '/pricing'}
                >
                  View Pricing
                  <TrendingUp className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </motion.div>

            {/* Subheading */}
            <AnimatedText delay={2.2} className="text-gray-400 text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed">
              Join the waitlist now and get early access as we put the finishing touches on Gradual.
            </AnimatedText>
          </div>
        </div>
      </section>

      {/* Waitlist Form Section */}
      <motion.section 
        id="waitlist" 
        className="py-20 bg-black/20 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              whileHover={{ 
                scale: 1.02,
                transition: { duration: 0.3 }
              }}
            >
              <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl hover-lift">
                <CardContent className="p-8">
                  <motion.h3 
                    className="text-2xl font-semibold text-white mb-6 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    viewport={{ once: true }}
                  >
                    Join the Waitlist
                  </motion.h3>

                  {isSubmitted ? (
                    <motion.div 
                      className="text-center py-8"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6 }}
                    >
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ duration: 0.8 }}
                      >
                        <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                      </motion.div>
                      <motion.p 
                        className="text-green-400 text-lg font-medium"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        Thanks for joining! We&apos;ll be in touch soon.
                      </motion.p>
                    </motion.div>
                  ) : (
                    <motion.form 
                      onSubmit={handleSubmit} 
                      className="space-y-4"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.6 }}
                      viewport={{ once: true }}
                    >
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.8 }}
                        viewport={{ once: true }}
                      >
                        <Input
                          type="text"
                          placeholder="Your name"
                          value={name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                          required
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-300 hover:bg-white/15"
                        />
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 1.0 }}
                        viewport={{ once: true }}
                      >
                        <Input
                          type="email"
                          placeholder="Your email"
                          value={email}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                          required
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-300 hover:bg-white/15"
                        />
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 1.2 }}
                        viewport={{ once: true }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 hover-lift"
                        >
                          Get Early Access
                        </Button>
                      </motion.div>
                    </motion.form>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section 
        className="py-20"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <motion.h3 
              className="text-3xl lg:text-4xl font-bold text-white mb-4"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              What is <motion.span 
                className="text-blue-400"
                animate={{ 
                  textShadow: [
                    "0 0 0px rgba(59, 130, 246, 0)",
                    "0 0 20px rgba(59, 130, 246, 0.5)",
                    "0 0 0px rgba(59, 130, 246, 0)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Gradual
              </motion.span>?
            </motion.h3>
            <motion.p 
              className="text-gray-400 text-lg max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              An intelligent platform that helps students and professionals land the right roles faster
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <FloatingCard key={index} delay={index * 0.2}>
                <Card className="bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 transition-all duration-300 hover:shadow-xl group hover-lift h-full">
                  <CardContent className="p-6 text-center h-full flex flex-col">
                    <motion.div 
                      className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition-all duration-300"
                      whileHover={{ 
                        scale: 1.1,
                        rotate: [0, -5, 5, 0],
                        transition: { duration: 0.3 }
                      }}
                    >
                      <motion.div
                        animate={{ 
                          rotate: [0, 5, -5, 0],
                          scale: [1, 1.05, 1]
                        }}
                        transition={{ 
                          duration: 3,
                          repeat: Infinity,
                          delay: index * 0.5
                        }}
                      >
                        <feature.icon className="h-8 w-8 text-blue-400 group-hover:text-blue-300 transition-colors duration-300" />
                      </motion.div>
                    </motion.div>
                    <motion.h4 
                      className="text-xl font-semibold text-white mb-3"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      {feature.title}
                    </motion.h4>
                    <motion.p 
                      className="text-gray-400 leading-relaxed flex-grow"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      {feature.description}
                    </motion.p>
                  </CardContent>
                </Card>
              </FloatingCard>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Consulting Section */}
      <motion.section 
        className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-black relative overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        {/* Subtle gold accent background */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-yellow-400/5 to-amber-500/5" />
        
        <div className="container mx-auto px-4 relative">
          <motion.div 
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="bg-white/5 backdrop-blur-md border-white/10 hover:border-amber-400/70 hover:bg-white/10 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/30 relative overflow-hidden group">
                <CardContent className="pt-4 md:pt-6 px-8 md:px-12 pb-8 md:pb-12">
                  <div className="text-center mb-8">
                    <motion.div
                      className="mb-4 flex justify-center"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                      viewport={{ once: true }}
                    >
                      <Image 
                        src="/newlogo2.png" 
                        alt="Gradual" 
                        width={200}
                        height={200}
                        unoptimized
                        className="h-8 md:h-10 lg:h-12 w-auto drop-shadow-2xl"
                        style={{ objectFit: 'contain' }}
                      />
                    </motion.div>
                    <motion.h3 
                      className="text-2xl md:text-3xl lg:text-4xl font-light text-gray-200 mb-4 leading-tight"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                      viewport={{ once: true }}
                    >
                      Career <span className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 bg-clip-text text-transparent">Consulting</span>
                    </motion.h3>
                    <motion.p 
                      className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed mb-8"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.6 }}
                      viewport={{ once: true }}
                    >
                      Personalised career consulting focused on strategy, positioning, and execution. Clear direction, stronger applications, and practical next steps tailored to your goals.
                    </motion.p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    {[
                      { icon: Target, text: "Strategy & Direction" },
                      { icon: TrendingUp, text: "Positioning & Optimisation" },
                      { icon: CheckCircle, text: "Execution" }
                    ].map((item, index) => (
                      <motion.div
                        key={index}
                        className="flex flex-col items-center text-center"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                        viewport={{ once: true }}
                      >
                        <motion.div 
                          className="mb-3 inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-400/20"
                          whileHover={{ 
                            scale: 1.1,
                            transition: { duration: 0.2 }
                          }}
                        >
                          <item.icon className="h-6 w-6 text-amber-400" />
                        </motion.div>
                        <p className="text-gray-300 text-sm font-medium">{item.text}</p>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div 
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.2 }}
                    viewport={{ once: true }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold px-8 py-4 text-lg rounded-full transition-all duration-300 shadow-lg hover:shadow-xl shadow-amber-500/30 hover-lift"
                        onClick={() => window.location.href = '/consulting'}
                      >
                        Explore Consulting
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        size="lg"
                        variant="outline"
                        className="border-amber-400/50 text-amber-300 hover:bg-amber-500/10 hover:border-amber-400 font-semibold px-8 py-4 text-lg rounded-full transition-all duration-300 hover-lift"
                        onClick={() => window.location.href = '/consulting/pricing'}
                      >
                        View Pricing
                      </Button>
                    </motion.div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>
    </motion.div>
  )
} 
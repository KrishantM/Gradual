"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Mail, Linkedin, ArrowLeft, Users, Target, Eye, MessageCircle } from "lucide-react"
import { motion } from "framer-motion"
import { useRef } from "react"
import { useInView } from "framer-motion"

// Animated components for About page
const AnimatedCard = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const AnimatedFeature = ({ icon: Icon, title, description, color, delay = 0 }: { 
  icon: any, 
  title: string, 
  description: string, 
  color: string, 
  delay?: number 
}) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  
  return (
    <motion.div 
      ref={ref}
      className="flex items-start space-x-3"
      initial={{ opacity: 0, x: -20 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ x: 5, transition: { duration: 0.2 } }}
    >
      <motion.div 
        className={`flex-shrink-0 w-6 h-6 ${color}/20 rounded-full flex items-center justify-center mt-1`}
        whileHover={{ scale: 1.2, rotate: 5 }}
        transition={{ duration: 0.2 }}
      >
        <Icon className={`w-3 h-3 ${color}`} />
      </motion.div>
      <div>
        <h3 className="text-white font-semibold text-sm sm:text-base">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
      </div>
    </motion.div>
  )
}

export default function AboutPage() {
  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div 
            className="text-center mb-8 sm:mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h1 
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              About <motion.span 
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
              </motion.span>
            </motion.h1>
            <motion.p 
              className="text-gray-300 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              The future of career building is here
            </motion.p>
          </motion.div>

          {/* Main Content */}
          <div className="space-y-6 sm:space-y-8">
            {/* Mission Statement */}
            <AnimatedCard delay={0.6}>
              <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl hover-lift">
                <CardContent className="p-6 sm:p-8">
                  <div className="space-y-4 sm:space-y-6">
                    <div className="text-center sm:text-left">
                      <motion.h2 
                        className="text-2xl sm:text-3xl font-bold text-white mb-4"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        viewport={{ once: true }}
                      >
                        Our Mission
                      </motion.h2>
                      <motion.p 
                        className="text-gray-300 text-base sm:text-lg leading-relaxed mb-4"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        viewport={{ once: true }}
                      >
                        We&apos;re building an intelligent platform that helps students and industry professionals land the right opportunities faster.
                      </motion.p>
                      <motion.p 
                        className="text-gray-300 text-base sm:text-lg leading-relaxed"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        viewport={{ once: true }}
                      >
                        From AI-powered CV scoring to personalized job matches and career guidance, Gradual gives users the tools to stand out in a noisy job market.
                      </motion.p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedCard>

            {/* What We Offer */}
            <AnimatedCard delay={0.8}>
              <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl hover-lift">
                <CardContent className="p-6 sm:p-8">
                  <motion.h2 
                    className="text-2xl sm:text-3xl font-bold text-white mb-6 text-center sm:text-left"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                  >
                    What We Offer
                  </motion.h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-3">
                      <AnimatedFeature 
                        icon={Target} 
                        title="CV Scoring & Optimization" 
                        description="Get AI-powered feedback to improve your resume" 
                        color="text-blue-400" 
                        delay={0.2}
                      />
                      <AnimatedFeature 
                        icon={Eye} 
                        title="Smart Job Matching" 
                        description="Personalized suggestions for internships and graduate roles" 
                        color="text-green-400" 
                        delay={0.4}
                      />
                      <AnimatedFeature 
                        icon={Users} 
                        title="Progress Tracking" 
                        description="Dynamic dashboard with actionable to-do lists" 
                        color="text-yellow-400" 
                        delay={0.6}
                      />
                    </div>

                    <div className="space-y-3">
                      <AnimatedFeature 
                        icon={MessageCircle} 
                        title="Live CV Assistant" 
                        description="Real-time career guidance and goal setting (coming soon)" 
                        color="text-purple-400" 
                        delay={0.8}
                      />
                      <AnimatedFeature 
                        icon={Users} 
                        title="Professional Profile" 
                        description="Build a profile that evolves with your career goals" 
                        color="text-cyan-400" 
                        delay={1.0}
                      />
                      <AnimatedFeature 
                        icon={Eye} 
                        title="Recruiter Portal" 
                        description="Advanced candidate insights for recruiters (coming soon)" 
                        color="text-orange-400" 
                        delay={1.2}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedCard>

            {/* Who Is Gradual For */}
            <AnimatedCard delay={1.0}>
              <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl hover-lift">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 text-center sm:text-left">
                  Who Is Gradual For?
                </h2>
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-white font-semibold text-base sm:text-lg mb-2">🎓 Students & Graduates</h3>
                    <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                      Final-year university students and recent graduates preparing for the job market
                    </p>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-white font-semibold text-base sm:text-lg mb-2">💼 Early-Career Professionals</h3>
                    <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                      Professionals exploring career pivots or looking to enhance their skills
                    </p>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-white font-semibold text-base sm:text-lg mb-2">🌏 International Students</h3>
                    <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                      Students seeking clarity and direction in local ANZ markets
                    </p>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-white font-semibold text-base sm:text-lg mb-2">👥 Recruiters & Coaches</h3>
                    <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                      Looking for smarter, data-driven candidate insights <span className="text-gray-500 italic">(coming soon)</span>
                    </p>
                  </div>
                </div>
              </CardContent>
              </Card>
            </AnimatedCard>

            {/* Our Vision */}
            <AnimatedCard delay={1.2}>
              <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl hover-lift">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 text-center sm:text-left">
                  Our Vision
                </h2>
                <div className="space-y-6">
                  <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
                    We are beginning with students, but Gradual is built for long-term growth. Our platform aims to support career progression from university to senior roles, adapting as your goals evolve.
                  </p>
                  
                  <div>
                    <h3 className="text-xl sm:text-2xl font-semibold text-white mb-4">Upcoming Features:</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-gray-300 text-sm sm:text-base">Recruiter-facing platform with candidate insights</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-gray-300 text-sm sm:text-base">ATS and LinkedIn integrations</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-gray-300 text-sm sm:text-base">Skill-gap analysis and course recommendations</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-gray-300 text-sm sm:text-base">Mentorship and collaboration tools</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card id="contact" className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 text-center sm:text-left">
                  Get In Touch
                </h2>
                <div className="space-y-4 sm:space-y-6">
                  <p className="text-gray-300 text-base sm:text-lg leading-relaxed text-center sm:text-left">
                    We welcome feedback, inquiries, and collaboration opportunities.
                  </p>
                  
                  <div className="space-y-3">
                    <a 
                      href="mailto:admin@gradual.co.nz" 
                      className="flex items-center justify-center sm:justify-start space-x-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <Mail className="w-5 h-5 text-blue-400" />
                      <span className="text-gray-300 text-sm sm:text-base">admin@gradual.co.nz</span>
                    </a>
                    
                    <a 
                      href="https://www.linkedin.com/company/gradual-ai" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center sm:justify-start space-x-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <Linkedin className="w-5 h-5 text-blue-400" />
                      <span className="text-gray-300 text-sm sm:text-base">Gradual on LinkedIn</span>
                    </a>
                  </div>
                  
                  <div className="flex justify-center sm:justify-start pt-4">
                    <Link href="/">
                      <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 flex items-center space-x-2">
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Home</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
              </Card>
            </AnimatedCard>
          </div>
        </div>
      </div>
    </motion.div>
  )
} 
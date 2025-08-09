"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Mail, Linkedin, ArrowLeft, Users, Target, Eye, MessageCircle } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black">
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              About <span className="text-blue-400">Gradual</span>
            </h1>
            <p className="text-gray-300 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
              The future of career building is here
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-6 sm:space-y-8">
            {/* Mission Statement */}
            <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
              <CardContent className="p-6 sm:p-8">
                <div className="space-y-4 sm:space-y-6">
                  <div className="text-center sm:text-left">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                      Our Mission
                    </h2>
                    <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-4">
                      We&apos;re building an intelligent platform that helps students and industry professionals land the right opportunities faster.
                    </p>
                    <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
                      From AI-powered CV scoring to personalized job matches and career guidance, Gradual gives users the tools to stand out in a noisy job market.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What We Offer */}
            <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 text-center sm:text-left">
                  What We Offer
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center mt-1">
                        <Target className="w-3 h-3 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-sm sm:text-base">CV Scoring & Optimization</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">Get AI-powered feedback to improve your resume</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center mt-1">
                        <Eye className="w-3 h-3 text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-sm sm:text-base">Smart Job Matching</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">Personalized suggestions for internships and graduate roles</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-yellow-500/20 rounded-full flex items-center justify-center mt-1">
                        <Users className="w-3 h-3 text-yellow-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-sm sm:text-base">Progress Tracking</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">Dynamic dashboard with actionable to-do lists</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center mt-1">
                        <MessageCircle className="w-3 h-3 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-sm sm:text-base">Live CV Assistant</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">Real-time career guidance and goal setting <span className="text-gray-500 italic">(coming soon)</span></p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center mt-1">
                        <Users className="w-3 h-3 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-sm sm:text-base">Professional Profile</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">Build a profile that evolves with your career goals</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-orange-500/20 rounded-full flex items-center justify-center mt-1">
                        <Eye className="w-3 h-3 text-orange-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-sm sm:text-base">Recruiter Portal</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">Advanced candidate insights for recruiters <span className="text-gray-500 italic">(coming soon)</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Who Is Gradual For */}
            <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
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

            {/* Our Vision */}
            <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
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
            <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
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
          </div>
        </div>
      </div>
    </div>
  )
} 
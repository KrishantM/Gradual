"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-black py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl mb-10">
          <CardContent className="p-8">
            <h1 className="text-4xl font-bold text-white mb-4 text-center">About Gradual</h1>
            <p className="text-gray-300 text-lg mb-4">
              Gradual is your intelligent career launchpad, designed to help students and early professionals transform their potential into opportunity. We believe career growth should be accessible, personalized, and most importantly, progressive.
            </p>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-1">
              <li>Score and optimize CVs</li>
              <li>Receive personalized suggestions for internships, graduate roles, and skill development</li>
              <li>Track progress through a dynamic dashboard and actionable to-do lists</li>
              <li>Build a professional profile that evolves with your goals</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl mb-10">
          <CardContent className="p-8">
            <h2 className="text-2xl font-semibold text-white mb-3">Who Is Gradual For?</h2>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-1">
              <li>Final-year university students preparing for the graduate job market</li>
              <li>Recent graduates taking their next professional steps</li>
              <li>Early-career professionals exploring career pivots or skill enhancement</li>
              <li>International students seeking clarity and direction in local markets</li>
              <li>Recruiters and career coaches looking for smarter, data-driven candidate insights <span className="italic text-gray-400">(coming soon)</span></li>
            </ul>
            <p className="text-gray-300">Whether you&apos;re navigating job boards or refining your CV, Gradual provides practical tools to guide the way.</p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl mb-10">
          <CardContent className="p-8">
            <h2 className="text-2xl font-semibold text-white mb-3">Our Vision</h2>
            <p className="text-gray-300 mb-4">We are beginning with students, but Gradual is built for long-term growth.</p>
            <h3 className="text-xl font-semibold text-white mb-2">Upcoming Features:</h3>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-1">
              <li>A recruiter-facing platform with candidate insights</li>
              <li>Integrations with ATS platforms and LinkedIn</li>
              <li>Skill-gap analysis and targeted course recommendations</li>
              <li>Verified CV scoring and badge system</li>
              <li>Mentorship and partner collaboration tools</li>
            </ul>
            <p className="text-gray-300">Gradual aims to support career progression from university to senior roles, adapting as your goals evolve.</p>
          </CardContent>
        </Card>

        <Card className="bg-white/5 backdrop-blur-md border-white/10 shadow-2xl">
          <CardContent className="p-8">
            <h2 className="text-2xl font-semibold text-white mb-3">Contact Us</h2>
            <p className="text-gray-300 mb-2">We welcome feedback, inquiries, and collaboration opportunities. Get in touch:</p>
            <ul className="text-gray-300 mb-4">
              <li>Email: <a href="mailto:admin@gradual.co.nz" className="underline hover:text-blue-400">admin@gradual.co.nz</a></li>
              <li>LinkedIn: <a href="https://www.linkedin.com/company/gradual-ai" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-400">Gradual on LinkedIn</a></li>
            </ul>
            <div className="flex justify-center">
              <Link href="/">
                <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-300">
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
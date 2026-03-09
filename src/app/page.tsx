"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Compass, BriefcaseBusiness, Brain, BarChart3 } from "lucide-react";

const highlights = [
  {
    icon: Brain,
    title: "Understand where you stand",
    description: "AI analyses your CV and highlights what to improve.",
  },
  {
    icon: Compass,
    title: "Know what to build next",
    description: "Get clear guidance on skills, projects, and experience.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Find opportunities that fit",
    description: "Jobs and internships matched to your profile.",
  },
  {
    icon: BarChart3,
    title: "Turn effort into momentum",
    description: "Track improvements and career progress over time.",
  },
];

const outcomes = [
  "A clear view of your career profile",
  "Guidance on what to improve next",
  "Stronger applications through feedback",
  "Opportunities matched to you",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <section className="border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="mb-6 flex items-center">
                <span className="logo-pill logo-pill-hero">
                  <Image
                    src="/newlogo2.png"
                    alt="Gradual"
                    width={180}
                    height={48}
                    className="logo-img logo-full h-10 w-auto"
                    priority
                    unoptimized
                  />
                  <Image
                    src="/newlogo2.png"
                    alt=""
                    width={180}
                    height={48}
                    className="logo-img logo-g h-10 w-auto"
                    priority
                    unoptimized
                    aria-hidden
                  />
                  <Image
                    src="/newlogo2.png"
                    alt=""
                    width={180}
                    height={48}
                    className="logo-img logo-radual h-10 w-auto"
                    unoptimized
                    aria-hidden
                  />
                </span>
              </div>

              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">
                Career OS
              </p>
              <h1 className="max-w-2xl text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
                Meet your Career OS
              </h1>
              <p className="text-muted mt-6 max-w-xl text-lg leading-relaxed">
                Analyse your CV, understand what to improve, and discover opportunities that move your career forward.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/register">
                  <Button className="h-11 rounded-md bg-slate-900 px-6 text-sm font-semibold text-white hover:bg-slate-800">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    variant="outline"
                    className="h-11 rounded-md border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>

            <div className="surface-card rounded-2xl p-6 sm:p-8">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                What you get
              </p>
              <ul className="space-y-3">
                {outcomes.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-sky-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Gradual Consulting is available for users wanting direct strategic support.
                <Link href="/consulting" className="ml-1 font-semibold underline decoration-amber-700/60 underline-offset-2">
                  Explore consulting
                </Link>
                .
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-10 max-w-2xl">
            <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">How it works</h2>
            <p className="text-muted mt-3">
              Gradual turns career development into a system.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {highlights.map((item) => (
              <article key={item.title} className="surface-card hover-lift rounded-xl p-5">
                <item.icon className="mb-4 h-5 w-5 text-sky-700" />
                <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                <p className="text-muted mt-2 text-sm leading-relaxed">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

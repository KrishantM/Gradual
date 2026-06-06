import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Brain,
  Target,
  Calendar,
  Briefcase,
  Sparkles,
  GraduationCap,
  CheckCircle2,
  FileText,
} from "lucide-react";

/* ─────────── Content ─────────── */

const features = [
  {
    icon: FileText,
    title: "CV Intelligence",
    description: "Score your CV and get concrete rewrites — not vague tips.",
  },
  {
    icon: Brain,
    title: "G.ai — Career AI",
    description: "A coach that knows your full profile — and sends your weekly plan straight to your calendar.",
  },
  {
    icon: GraduationCap,
    title: "Capability Paths",
    description: "Structured tracks to build real, durable skills.",
  },
  {
    icon: Briefcase,
    title: "Opportunities",
    description: "Curated roles matched to your profile automatically.",
  },
];

/* ─────────── Why Gradual ─────────── */

const comparisons = [
  {
    notThis: "Generic AI chatbot",
    butThis: "Context-aware coaching",
    body: "G.ai reads your CV score, skill gaps, and application lag. Every suggestion is specific to where you actually are — not a blank prompt.",
  },
  {
    notThis: "Job board",
    butThis: "Profile-matched roles",
    body: "Opportunities surface based on your real profile. Improve your CV; the match quality improves with it.",
  },
  {
    notThis: "Disconnected tools",
    butThis: "One compounding system",
    body: "Score your CV → signals surface in G.ai → weekly plan updates → tracker closes the loop. Each action feeds the next.",
  },
];

/* ─────────── Hero Product Preview ─────────── */

function HeroPreview() {
  return (
    <div className="surface-card-elevated relative mx-auto max-w-3xl overflow-hidden rounded-2xl p-5 text-left sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="sidebar-avatar h-7 w-7 text-[10px]">KM</div>
          <div>
            <div className="text-xs font-semibold text-[var(--foreground)]">Welcome back, Krishant</div>
            <div className="text-[10px] text-[var(--text-muted)]">Here&apos;s what matters today</div>
          </div>
        </div>
        <span className="badge badge-blue text-[10px]">Career OS</span>
      </div>

      <div className="mb-3 flex items-center gap-2.5 rounded-lg border border-[var(--accent-blue)]/25 bg-[var(--accent-blue-soft)] px-3 py-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--accent-blue)]/15">
          <Sparkles className="h-3.5 w-3.5 text-[var(--accent-blue)]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold text-[var(--accent-blue)]">Priority signal</div>
          <div className="truncate text-xs text-[var(--foreground)]">
            Your CV summary is underselling your experience — refresh it this week.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Profile", value: "72%", icon: Target },
          { label: "CV Score", value: "84", icon: FileText },
          { label: "Focus", value: "3", icon: Calendar },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-lg border border-[var(--border-soft)] bg-[var(--surface-subtle)] px-2.5 py-2"
          >
            <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
              <m.icon className="h-3 w-3" />
              {m.label}
            </div>
            <div className="mt-0.5 text-base font-semibold text-[var(--foreground)]">{m.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────── Page ─────────── */

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      {/* ─── Hero ─── */}
      <section className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(900px 550px at 50% -5%, color-mix(in srgb, var(--accent-blue) 14%, transparent), transparent 65%), radial-gradient(700px 450px at 85% 10%, color-mix(in srgb, var(--accent-purple) 10%, transparent), transparent 60%)",
          }}
        />
        <div className="mx-auto max-w-5xl px-4 pb-14 pt-8 text-center sm:px-6 sm:pb-16 sm:pt-12 lg:px-8 lg:pt-14">
          {/* Logo front and center */}
          <div className="mb-7 flex justify-center sm:mb-8">
            <span className="logo-pill logo-pill-hero">
              <Image
                src="/newlogo2.png"
                alt="Gradual"
                width={220}
                height={60}
                priority
                unoptimized
                className="logo-img logo-full h-12 w-auto sm:h-14"
              />
              <Image
                src="/newlogo2.png"
                alt=""
                width={220}
                height={60}
                priority
                unoptimized
                className="logo-img logo-g h-12 w-auto sm:h-14"
                aria-hidden
              />
              <Image
                src="/newlogo2.png"
                alt=""
                width={220}
                height={60}
                unoptimized
                className="logo-img logo-radual h-12 w-auto sm:h-14"
                aria-hidden
              />
            </span>
          </div>

          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--surface)]/80 px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] shadow-[var(--shadow-sm)] backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent-blue)] opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--accent-blue)]" />
            </span>
            Career OS for students & early professionals
          </div>

          <h1 className="mx-auto max-w-3xl text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.025em] text-[var(--foreground)] sm:text-5xl lg:text-[3.5rem]">
            Your career,{" "}
            <span className="bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)] bg-clip-text text-transparent">
              built gradually.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
            Score your CV, get AI coaching on your gaps, plan your week, and find matched roles — one system
            where every improvement feeds the next.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register" className="w-full sm:w-auto">
              <Button className="h-12 w-full rounded-xl bg-[var(--accent-blue)] px-7 text-sm font-semibold text-white shadow-[var(--shadow-md)] transition-all duration-200 hover:bg-[var(--accent-blue-strong)] hover:shadow-[var(--shadow-lg)] sm:w-auto">
                Start for free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="h-12 w-full rounded-xl border-[var(--border)] bg-[var(--surface)] px-7 text-sm font-semibold text-[var(--text-secondary)] transition-colors duration-200 hover:bg-[var(--surface-subtle)] sm:w-auto"
              >
                Sign in
              </Button>
            </Link>
          </div>

          <p className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[var(--success)]" />
              Free to start
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[var(--success)]" />
              No credit card
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[var(--success)]" />
              Built with students
            </span>
          </p>

          {/* Product preview */}
          <div className="relative mt-12 sm:mt-14">
            <div
              aria-hidden
              className="absolute -inset-4 -z-10 rounded-3xl opacity-60 blur-2xl"
              style={{
                background:
                  "linear-gradient(135deg, color-mix(in srgb, var(--accent-blue) 18%, transparent), color-mix(in srgb, var(--accent-purple) 12%, transparent))",
              }}
            />
            <HeroPreview />
          </div>
        </div>
      </section>

      {/* ─── Features row ─── */}
      <section className="border-t border-[var(--border-soft)]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">
              Four tools. One connected system.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
              Each is useful on its own. Together, they compound.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="surface-card hover-lift rounded-xl p-5">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-blue-soft)]">
                  <feature.icon className="h-5 w-5 text-[var(--accent-blue)]" />
                </div>
                <h3 className="text-base font-semibold text-[var(--foreground)]">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why Gradual ─── */}
      <section className="border-t border-[var(--border-soft)]">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">
              Not a chatbot. Not a job board.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
              Generic AI gives generic advice. Job boards list roles. Gradual connects the two — routing every
              improvement back through the whole system.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {comparisons.map((c) => (
              <div key={c.notThis} className="surface-card rounded-xl p-5">
                <p className="mb-1 text-xs font-medium text-[var(--text-muted)] line-through decoration-[var(--text-muted)]/50">
                  {c.notThis}
                </p>
                <p className="mb-2.5 text-sm font-semibold text-[var(--accent-blue)]">{c.butThis}</p>
                <p className="text-sm leading-relaxed text-[var(--text-muted)]">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Closing CTA ─── */}
      <section className="px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-[var(--border-soft)] bg-[var(--surface)] p-10 text-center shadow-[var(--shadow-lg)] sm:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 opacity-80"
            style={{
              background:
                "radial-gradient(600px 400px at 50% 0%, color-mix(in srgb, var(--accent-blue) 14%, transparent), transparent 70%)",
            }}
          />
          <h2 className="mx-auto max-w-2xl text-2xl font-semibold tracking-tight text-[var(--foreground)] sm:text-3xl">
            Stop guessing. Start growing.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
            Free to start. Upgrade when you&apos;re ready.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/register" className="w-full sm:w-auto">
              <Button className="h-12 w-full rounded-xl bg-[var(--accent-blue)] px-8 text-sm font-semibold text-white shadow-[var(--shadow-md)] transition-all duration-200 hover:bg-[var(--accent-blue-strong)] hover:shadow-[var(--shadow-lg)] sm:w-auto">
                Start for free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

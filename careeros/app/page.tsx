"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Loader2, Upload, Brain, Target, FileEdit, Sparkles, ArrowRight, Check, Star, TrendingUp, Shield, Zap, ChevronDown } from "lucide-react"
import { AnimatedSection, AnimatedStagger, useCountUp } from "@/components/animations"

const words = ["Analyze.", "Optimize.", "Succeed.", "Get Hired."]

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-careeros-bg">
        <Loader2 className="h-8 w-8 animate-spin text-careeros-accent" aria-hidden="true" />
      </div>
    )
  }

  if (user) return null

  const features = [
    {
      icon: Upload,
      title: "Smart CV Parsing",
      description: "Upload any PDF, DOCX, or TXT — our AI extracts your entire professional story in seconds.",
      gradient: "from-[#E879A3] to-[#F5A1C0]",
    },
    {
      icon: Brain,
      title: "Career Truth Engine",
      description: "Data-driven diagnosis of why you're not getting interviews, backed by real market data.",
      gradient: "from-[#A78BFA] to-[#C4B5FD]",
    },
    {
      icon: Target,
      title: "Job Match Scoring",
      description: "Paste any job URL and get an instant match score with prioritized skill gap analysis.",
      gradient: "from-[#34D399] to-[#6EE7B7]",
    },
    {
      icon: FileEdit,
      title: "AI CV Rewrite",
      description: "Job-specific optimization that beats ATS filters and gets you past recruiter screening.",
      gradient: "from-[#F59E0B] to-[#FBBF24]",
    },
  ]

  const stats = [
    { value: 10, suffix: "s", label: "AI Analysis Time" },
    { value: 89, suffix: "%", label: "Match Accuracy" },
    { value: 3, suffix: "x", label: "More Interviews" },
  ]

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "/mo",
      description: "Try before you commit",
      features: [
        "1 full CV analysis",
        "Basic skill gap report",
        "Interview probability score",
        "7-day history",
      ],
      cta: "Start Free",
      highlight: false,
    },
    {
      name: "Pro",
      price: "$9",
      period: "/mo",
      description: "For serious job seekers",
      features: [
        "Unlimited CV analyses",
        "Job-specific CV rewrites",
        "Career Truth Engine",
        "Unlimited job matches",
        "Priority support",
      ],
      cta: "Get Pro",
      highlight: true,
    },
    {
      name: "Premium",
      price: "$19",
      period: "/mo",
      description: "For career changers & execs",
      features: [
        "Everything in Pro",
        "LinkedIn profile optimization",
        "Cover letter generation",
        "Interview prep questions",
        "Monthly career strategy call",
      ],
      cta: "Go Premium",
      highlight: false,
    },
  ]

  return (
    <div className="min-h-screen bg-careeros-bg text-careeros-text selection:bg-careeros-accent/30">
      {/* Scroll-aware translucent nav */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-careeros-bg/80 backdrop-blur-xl border-b border-careeros-border"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-careeros-accent to-[#F5A1C0] flex items-center justify-center">
                <span className="text-black font-bold text-sm">C</span>
              </div>
              <span className="text-lg font-bold tracking-tight">CareerOS</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <Link href="#features" className="px-4 py-2 text-sm text-careeros-text-muted hover:text-careeros-text transition-colors rounded-lg hover:bg-white/5">
                Features
              </Link>
              <Link href="#pricing" className="px-4 py-2 text-sm text-careeros-text-muted hover:text-careeros-text transition-colors rounded-lg hover:bg-white/5">
                Pricing
              </Link>
              <div className="w-px h-6 bg-careeros-border mx-3" />
              <Link href="/login">
                <Button variant="ghost" className="text-sm min-h-[44px] text-careeros-text-muted hover:text-careeros-text">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="text-sm min-h-[44px] bg-careeros-accent hover:bg-careeros-accent-hover text-black font-medium px-5">
                  Get Started
                </Button>
              </Link>
            </div>
            {/* Mobile menu button */}
            <MobileMenu />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        {/* Ambient background glow */}
        <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] rounded-full bg-careeros-accent/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 -right-32 w-[400px] h-[400px] rounded-full bg-[#A78BFA]/10 blur-[100px] pointer-events-none" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(245,241,235,0.3) 1px, transparent 0)`,
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <AnimatedSection>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-careeros-border bg-careeros-surface/50 text-sm text-careeros-text-muted mb-8">
                <Sparkles className="h-3.5 w-3.5 text-careeros-accent" aria-hidden="true" />
                AI-Powered Career Intelligence
              </div>
            </AnimatedSection>

            {/* Heading with word cycle */}
            <AnimatedSection delay={100}>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
                Your Career,{" "}
                <span className="gradient-text">Unlocked.</span>
                <br />
                <span className="inline-flex flex-col h-[1.1em] overflow-hidden text-careeros-text-muted">
                  <span className="animate-career-cycle leading-[1.1]">
                    {words.map((w) => (
                      <span key={w} className="block">{w}</span>
                    ))}
                  </span>
                </span>
              </h1>
            </AnimatedSection>

            {/* Subtitle */}
            <AnimatedSection delay={200}>
              <p className="text-base sm:text-lg md:text-xl text-careeros-text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
                Stop guessing why you&apos;re not getting interviews. CareerOS analyzes your CV against real market data,
                tells you exactly what&apos;s wrong, and rewrites it to get you hired.
              </p>
            </AnimatedSection>

            {/* CTAs */}
            <AnimatedSection delay={300}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="min-h-[48px] text-base px-8 w-full sm:w-auto bg-careeros-accent hover:bg-careeros-accent-hover text-black font-medium glow-pink transition-all duration-300"
                  >
                    Start Free — No Credit Card
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button
                    variant="outline"
                    size="lg"
                    className="min-h-[48px] text-base px-8 w-full sm:w-auto border-careeros-border text-careeros-text hover:bg-careeros-surface"
                  >
                    See How It Works
                  </Button>
                </Link>
              </div>
            </AnimatedSection>

            {/* Trust indicator */}
            <AnimatedSection delay={400}>
              <div className="mt-16 flex flex-col items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-8 w-8 rounded-full border-2 border-careeros-bg bg-careeros-surface flex items-center justify-center text-xs font-medium text-careeros-text-muted"
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                  <div className="h-8 w-8 rounded-full border-2 border-careeros-bg bg-careeros-accent flex items-center justify-center text-xs font-bold text-black">
                    +
                  </div>
                </div>
                <p className="text-xs text-careeros-text-muted">
                  Join early-access users transforming their careers
                </p>
              </div>
            </AnimatedSection>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-careeros-text-muted/50">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <ChevronDown className="h-4 w-4 animate-bounce" aria-hidden="true" />
        </div>
      </section>

      {/* Stats section */}
      <section className="relative py-20 border-t border-careeros-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="grid grid-cols-3 gap-8 md:gap-16">
              {stats.map((stat) => (
                <StatCard key={stat.label} value={stat.value} suffix={stat.suffix} label={stat.label} />
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Features section */}
      <section id="features" className="relative py-24 md:py-32 border-t border-careeros-border">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-careeros-accent/5 blur-[150px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-16 md:mb-20">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                What <span className="gradient-text">CareerOS</span> Does
              </h2>
              <p className="text-careeros-text-muted text-lg max-w-xl mx-auto">
                Everything you need to land more interviews, from analysis to optimization.
              </p>
            </div>
          </AnimatedSection>

          <AnimatedStagger baseDelay={100} staggerDelay={150}>
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative p-6 md:p-8 rounded-2xl border border-careeros-border bg-careeros-surface/50 hover:bg-careeros-surface transition-all duration-500 hover:border-careeros-accent/20 hover:shadow-[0_0_30px_rgba(232,121,163,0.08)]"
              >
                <div className="flex items-start gap-5">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.gradient} p-[1px] shrink-0`}>
                    <div className="h-full w-full rounded-xl bg-careeros-surface flex items-center justify-center">
                      <feature.icon className="h-5 w-5 text-careeros-accent" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-careeros-text-muted leading-relaxed">{feature.description}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-careeros-text-muted/30 group-hover:text-careeros-accent transition-colors hidden md:block" aria-hidden="true" />
                </div>
              </div>
            ))}
          </AnimatedStagger>
        </div>
      </section>

      {/* AI Score Panel section */}
      <section className="relative py-24 md:py-32 border-t border-careeros-border overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-[#A78BFA]/5 blur-[100px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            <AnimatedSection>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-careeros-border bg-careeros-surface/50 text-xs text-careeros-text-muted mb-6">
                  <Brain className="h-3 w-3 text-careeros-accent" aria-hidden="true" />
                  AI-Powered Analysis
                </div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                  Know Your <span className="gradient-text">Hire Score</span>
                </h2>
                <p className="text-careeros-text-muted leading-relaxed mb-6">
                  Our AI engine analyzes your CV against thousands of job descriptions to produce
                  a comprehensive career health report. No fluff, no generic advice — just
                  data-driven insights.
                </p>
                <ul className="space-y-3">
                  {[
                    "Interview probability score with percentile ranking",
                    "Top 5 skill gaps prioritized by market demand",
                    "Keyword frequency analysis against your target roles",
                    "Personalized improvement roadmap",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-careeros-text-muted">
                      <Check className="h-4 w-4 text-careeros-accent mt-0.5 shrink-0" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <div className="relative">
                {/* Score panel mockup */}
                <div className="glass-card rounded-2xl p-6 md:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-xs text-careeros-text-muted uppercase tracking-wider">Hire Score</p>
                      <p className="text-2xl font-bold">Overall</p>
                    </div>
                    <div className="relative">
                      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
                        <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(245,241,235,0.06)" strokeWidth="6" />
                        <circle cx="36" cy="36" r="30" fill="none" stroke="#E879A3" strokeWidth="6" strokeDasharray="188.5" strokeDashoffset="75.4" strokeLinecap="round" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">62%</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: "Skills Match", value: 68, color: "bg-careeros-accent" },
                      { label: "Experience Fit", value: 55, color: "bg-[#A78BFA]" },
                      { label: "Keyword Optimization", value: 42, color: "bg-[#F59E0B]" },
                    ].map((bar) => (
                      <div key={bar.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-careeros-text-muted">{bar.label}</span>
                          <span className="font-medium">{bar.value}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-careeros-border overflow-hidden">
                          <div
                            className={`h-full rounded-full ${bar.color} transition-all duration-1000`}
                            style={{ width: `${bar.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating badge */}
                <div className="absolute -bottom-4 -right-4 glass-card rounded-xl px-4 py-3 hidden md:flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-careeros-accent" aria-hidden="true" />
                  <div>
                    <p className="text-xs text-careeros-text-muted">Potential Increase</p>
                    <p className="text-sm font-bold">+45% after optimization</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Why CareerOS */}
      <section className="relative py-24 md:py-32 border-t border-careeros-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                Why <span className="gradient-text">CareerOS</span>?
              </h2>
              <p className="text-careeros-text-muted text-lg max-w-xl mx-auto">
                Built for the modern job market, designed for real results.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Get your full analysis in under 10 seconds with our streaming AI pipeline.",
              },
              {
                icon: Shield,
                title: "Market-Aligned",
                description: "Real-time market data ensures your CV matches what employers actually want.",
              },
              {
                icon: Star,
                title: "Actionable Insights",
                description: "Every recommendation comes with a clear \"why\" and a specific fix.",
              },
            ].map((item) => (
              <AnimatedSection key={item.title} delay={100}>
                <div className="text-center p-6">
                  <div className="h-12 w-12 rounded-xl bg-careeros-accent/10 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="h-5 w-5 text-careeros-accent" aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-careeros-text-muted leading-relaxed">{item.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative py-24 md:py-32 border-t border-careeros-border">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-careeros-accent/5 blur-[150px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                Simple <span className="gradient-text">Pricing</span>
              </h2>
              <p className="text-careeros-text-muted text-lg max-w-xl mx-auto">
                Start free, upgrade when you need more power.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <AnimatedSection key={plan.name} delay={200}>
                <div
                  className={`relative rounded-2xl p-6 md:p-8 transition-all duration-500 ${
                    plan.highlight
                      ? "bg-careeros-accent/5 border-2 border-careeros-accent/40 shadow-[0_0_30px_rgba(232,121,163,0.1)]"
                      : "border border-careeros-border bg-careeros-surface/50"
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-careeros-accent text-black text-xs font-semibold">
                      Most Popular
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                    <p className="text-sm text-careeros-text-muted mb-4">{plan.description}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-sm text-careeros-text-muted">{plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-3 text-sm text-careeros-text-muted">
                        <Check className="h-4 w-4 text-careeros-accent shrink-0" aria-hidden="true" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup">
                    <Button
                      className={`w-full min-h-[44px] text-sm font-medium ${
                        plan.highlight
                          ? "bg-careeros-accent hover:bg-careeros-accent-hover text-black"
                          : "bg-careeros-surface border border-careeros-border text-careeros-text hover:bg-careeros-surface/80"
                      }`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 md:py-32 border-t border-careeros-border">
        <div className="absolute inset-0 bg-gradient-to-b from-careeros-accent/5 to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Ready to <span className="gradient-text">Transform</span> Your Career?
            </h2>
            <p className="text-careeros-text-muted text-lg mb-8 max-w-lg mx-auto">
              Join the waitlist and be the first to experience AI-powered career intelligence.
            </p>
            <Link href="/signup">
              <Button
                size="lg"
                className="min-h-[48px] text-base px-10 bg-careeros-accent hover:bg-careeros-accent-hover text-black font-medium glow-pink transition-all duration-300"
              >
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-careeros-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-gradient-to-br from-careeros-accent to-[#F5A1C0] flex items-center justify-center">
                <span className="text-black font-bold text-[10px]">C</span>
              </div>
              <span className="text-sm font-medium">CareerOS</span>
            </div>
            <p className="text-xs text-careeros-text-muted text-center">
              AI Career Intelligence for the next generation of professionals.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* Sub-components */

function MobileMenu() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-white/5"
        onClick={() => setOpen(!open)}
        aria-label="Menu"
      >
        <div className="w-5 h-4 flex flex-col justify-between">
          <span className={`block h-px w-full bg-careeros-text transition-all ${open ? "rotate-45 translate-y-[7px]" : ""}`} />
          <span className={`block h-px w-full bg-careeros-text transition-all ${open ? "opacity-0" : ""}`} />
          <span className={`block h-px w-full bg-careeros-text transition-all ${open ? "-rotate-45 -translate-y-[7px]" : ""}`} />
        </div>
      </button>
      {open && (
        <div className="absolute top-16 left-0 right-0 border-b border-careeros-border bg-careeros-bg/95 backdrop-blur-xl md:hidden">
          <div className="px-4 py-4 space-y-2">
            <Link href="#features" onClick={() => setOpen(false)} className="block px-4 py-3 rounded-lg text-sm text-careeros-text-muted hover:bg-white/5">Features</Link>
            <Link href="#pricing" onClick={() => setOpen(false)} className="block px-4 py-3 rounded-lg text-sm text-careeros-text-muted hover:bg-white/5">Pricing</Link>
            <hr className="border-careeros-border my-2" />
            <Link href="/login" onClick={() => setOpen(false)} className="block px-4 py-3 rounded-lg text-sm font-medium">Sign In</Link>
            <Link href="/signup" onClick={() => setOpen(false)} className="block px-4 py-3 rounded-lg text-sm font-medium bg-careeros-accent text-black text-center">Get Started</Link>
          </div>
        </div>
      )}
    </>
  )
}

function StatCard({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { count, ref } = useCountUp(value, 2000)
  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl md:text-5xl font-bold gradient-text mb-1">
        {count}
        {suffix}
      </div>
      <p className="text-xs md:text-sm text-careeros-text-muted">{label}</p>
    </div>
  )
}

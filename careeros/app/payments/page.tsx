"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import type { TierKey } from "@/lib/paystack"
import { Nav } from "@/components/nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Check, Sparkles, Zap, Shield } from "lucide-react"

const TIER_INFO: Record<TierKey, {
  name: string
  price: string
  priceSub: string
  features: string[]
  icon: typeof Check
  popular?: boolean
}> = {
  free: {
    name: "Free",
    price: "GHS 0",
    priceSub: "forever",
    icon: Shield,
    features: [
      "1 CV analysis",
      "Basic match score",
      "AI weakness detection",
      "Dashboard access",
    ],
  },
  pro: {
    name: "Pro",
    price: "GHS 60",
    priceSub: "/month",
    icon: Zap,
    popular: true,
    features: [
      "Unlimited CV analyses",
      "Job-specific CV rewrite",
      "Advanced Career Truth",
      "Priority support",
      "All Free features",
    ],
  },
  premium: {
    name: "Premium",
    price: "GHS 180",
    priceSub: "/month",
    icon: Sparkles,
    features: [
      "Everything in Pro",
      "Recruiter message generator",
      "Interview prep notes",
      "ATS keyword optimization",
      "LinkedIn profile optimization",
      "Dedicated support",
    ],
  },
}

export default function PaymentsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [currentTier, setCurrentTier] = useState<TierKey>("free")
  const [processing, setProcessing] = useState<TierKey | null>(null)
  const [loadingTier, setLoadingTier] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    const userId = user.id

    async function loadUserTier() {
      try {
        const { data } = await supabase
          .from("users")
          .select("subscription_tier")
          .eq("id", userId)
          .single()
        setCurrentTier(((data as any)?.subscription_tier as TierKey) || "free")
      } catch {
        // Default to free
      } finally {
        setLoadingTier(false)
      }
    }

    loadUserTier()
  }, [user])

  const handleUpgrade = async (tier: TierKey) => {
    if (tier === "free" || tier === currentTier) return

    setProcessing(tier)

    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || "Payment initialization failed")
      }

      const { authorization_url } = await res.json()
      window.location.href = authorization_url
    } catch (err) {
      toast({
        title: "Payment failed",
        description: err instanceof Error ? err.message : "Could not initialize payment",
        variant: "destructive",
      })
      setProcessing(null)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-careeros-bg">
        <Loader2 className="h-8 w-8 animate-spin text-careeros-accent" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-careeros-bg">
      <Nav />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-careeros-text mb-2">Choose Your Plan</h1>
          <p className="text-careeros-text-muted max-w-lg mx-auto">
            Start free, upgrade when you need more. All prices in GHS (Ghanaian Cedis).
          </p>
          {currentTier !== "free" && (
            <Badge className="mt-4 bg-careeros-accent/10 text-careeros-accent border-careeros-accent/20">
              Current plan: {currentTier === "pro" ? "Pro" : "Premium"}
            </Badge>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {(Object.keys(TIER_INFO) as TierKey[]).map((tier) => {
            const info = TIER_INFO[tier]
            const Icon = info.icon
            const isCurrent = currentTier === tier
            const isLoading = processing === tier

            return (
              <Card
                key={tier}
                className={`relative flex flex-col bg-careeros-surface border-careeros-border ${
                  info.popular ? "border-careeros-accent/40 shadow-[0_0_30px_rgba(232,121,163,0.1)]" : ""
                }`}
              >
                {info.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-careeros-accent text-black border-0">Most Popular</Badge>
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon
                      className={`h-5 w-5 ${
                        tier === "pro" ? "text-careeros-accent" : tier === "premium" ? "text-[#A78BFA]" : "text-careeros-text-muted"
                      }`} aria-hidden="true"
                    />
                    <CardTitle className="text-xl text-careeros-text">{info.name}</CardTitle>
                  </div>
                  <div>
                    <span className="text-3xl font-bold text-careeros-text">{info.price}</span>
                    <span className="text-careeros-text-muted ml-1">{info.priceSub}</span>
                  </div>
                  <CardDescription className="text-careeros-text-muted">Everything you need to get started</CardDescription>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-3 mb-8 flex-1">
                    {info.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-careeros-text-muted">
                        <Check className="h-4 w-4 text-careeros-accent mt-0.5 shrink-0" aria-hidden="true" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleUpgrade(tier)}
                    disabled={isCurrent || isLoading || tier === "free"}
                    className="w-full min-h-[48px]"
                    variant={info.popular ? "default" : "outline"}
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
                        Processing...
                      </>
                    ) : isCurrent ? (
                      "Current Plan"
                    ) : tier === "free" ? (
                      "Free"
                    ) : (
                      `Upgrade to ${info.name}`
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Payment info */}
        <div className="mt-12 text-center text-sm text-careeros-text-muted max-w-lg mx-auto">
          <p className="mb-2">
            Payments are processed securely by Paystack. Your card details never touch our servers.
          </p>
          <p>
            You can cancel your subscription at any time. No questions asked.
          </p>
        </div>
      </main>

      {/* Payment callback handler */}
      <PaymentCallback />
    </div>
  )
}

function PaymentCallback() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const reference = params.get("reference")
    const trxref = params.get("trxref")

    const ref = reference || trxref

    if (ref && user) {
      fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: ref }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            toast({
              title: "Payment successful!",
              description: `You're now on the ${data.tier} plan.`,
            })
            router.push("/dashboard")
          } else {
            toast({
              title: "Payment verification",
              description: "Please check your subscription status.",
              variant: "destructive",
            })
          }
        })
        .catch(() => {
          router.push("/dashboard")
        })
    }
  }, [user, router, toast])

  return null
}

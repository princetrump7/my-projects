"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle2, XCircle, ArrowRight, Sparkles } from "lucide-react"

function CallbackContent() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying")
  const [tier, setTier] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const reference = searchParams.get("reference") || searchParams.get("trxref")

    if (!reference) {
      setStatus("failed")
      setErrorMsg("No payment reference found. Please try again or contact support.")
      return
    }

    async function verify() {
      try {
        const response = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        })

        const data = await response.json()

        if (response.ok && data.success) {
          setStatus("success")
          setTier(data.tier)
          toast({
            title: "Payment Verified!",
            description: `You have successfully upgraded to the ${data.tier} tier.`,
          })
          const timer = setTimeout(() => {
            router.push("/dashboard")
          }, 4000)
          return () => clearTimeout(timer)
        } else {
          setStatus("failed")
          setErrorMsg(data.message || "Failed to verify transaction. Please try again.")
          toast({
            title: "Verification Failed",
            description: data.message || "Failed to verify transaction.",
            variant: "destructive",
          })
        }
      } catch (err) {
        console.error("Callback verification error:", err)
        setStatus("failed")
        setErrorMsg("An unexpected error occurred during verification.")
      }
    }

    verify()
  }, [user, searchParams, router, toast])

  return (
    <div className="min-h-screen flex items-center justify-center bg-careeros-bg px-4 py-12">
      <Card className="w-full max-w-md bg-careeros-surface border-careeros-border relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-careeros-accent/10 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-careeros-accent/10 blur-3xl" />

        <CardHeader className="text-center pt-8">
          <div className="flex justify-center mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-careeros-accent to-[#F5A1C0] flex items-center justify-center">
              <span className="text-black font-bold text-lg">C</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-careeros-text">Payment Verification</CardTitle>
          <CardDescription className="text-careeros-text-muted mt-2">
            {status === "verifying" && "Checking transaction details with Paystack..."}
            {status === "success" && "Subscription successfully activated!"}
            {status === "failed" && "There was an issue verifying your payment."}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col items-center justify-center pb-8 pt-4 px-6 text-center">
          {status === "verifying" && (
            <div className="flex flex-col items-center gap-6 py-6">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-t-2 border-r-2 border-careeros-accent animate-spin" />
                <div className="absolute inset-2 rounded-full border-b-2 border-l-2 border-careeros-accent/50 animate-spin duration-700" />
              </div>
              <p className="text-sm text-careeros-text-muted animate-pulse">Securing transaction connection...</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-6 py-4 w-full">
              <div className="h-20 w-20 rounded-full bg-careeros-accent/10 border border-careeros-accent/20 flex items-center justify-center relative">
                <CheckCircle2 className="h-10 w-10 text-careeros-accent animate-bounce" aria-hidden="true" />
                <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-careeros-accent animate-pulse" aria-hidden="true" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-careeros-accent">Upgrade Complete</h3>
                <p className="text-sm text-careeros-text-muted">
                  Welcome to the <span className="font-bold text-careeros-text">{tier}</span> tier!
                </p>
                <p className="text-xs text-careeros-text-muted/50 max-w-xs mx-auto mt-2">
                  Redirecting to your workspace in a few seconds...
                </p>
              </div>

              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full mt-4 min-h-[48px] bg-careeros-accent hover:bg-careeros-accent-hover text-black font-medium"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
              </Button>
            </div>
          )}

          {status === "failed" && (
            <div className="flex flex-col items-center gap-6 py-4 w-full">
              <div className="h-20 w-20 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <XCircle className="h-10 w-10 text-rose-400" aria-hidden="true" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-rose-400">Verification Failed</h3>
                <p className="text-sm text-careeros-text-muted max-w-xs mx-auto leading-relaxed">
                  {errorMsg || "We couldn't confirm this payment. Check your bank or try again."}
                </p>
              </div>

              <div className="flex flex-col gap-3 w-full mt-4">
                <Button
                  onClick={() => router.push("/payments")}
                  className="w-full min-h-[48px] bg-careeros-surface border border-careeros-border text-careeros-text hover:bg-careeros-surface/80 font-medium"
                >
                  Return to Pricing
                </Button>
                <Button
                  onClick={() => router.push("/dashboard")}
                  variant="link"
                  className="text-careeros-text-muted hover:text-careeros-text text-sm"
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-careeros-bg">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-careeros-accent" aria-hidden="true" />
          <p className="text-sm text-careeros-text-muted">Loading page...</p>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
}

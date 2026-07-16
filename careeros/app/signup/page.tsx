"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { signUp } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, MailCheck } from "lucide-react"

function SignUpForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)
  const [savedEmail, setSavedEmail] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = await signUp(email, password, name)
      if (data?.session) {
        // Auto-confirmed — go straight to dashboard
        toast({
          title: "Account created!",
          description: "Welcome to CareerOS!",
          variant: "default",
        })
        const redirect = searchParams.get("redirect")
        router.push(redirect === "extension" ? "/dashboard?redirect=extension" : "/dashboard")
      } else {
        // Email confirmation is required — show confirmation screen
        setSavedEmail(email)
        setConfirmationSent(true)
      }
    } catch (err) {
      toast({
        title: "Sign up failed",
        description: err instanceof Error ? err.message : "Could not create account",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (confirmationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-careeros-bg px-4">
        <Card className="w-full max-w-md bg-careeros-surface border-careeros-border">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-careeros-accent/20">
              <MailCheck className="h-6 w-6 text-careeros-accent" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl text-careeros-text">Check your email</CardTitle>
            <CardDescription className="text-careeros-text-muted">
              We sent a confirmation link to <strong className="text-careeros-text">{savedEmail}</strong>. Click it to activate your account, then sign in.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-careeros-text-muted">
              Didn&apos;t receive an email? Check your spam folder or{" "}
              <button
                onClick={() => {
                  setConfirmationSent(false)
                  // Let user try again from the form
                }}
                className="text-careeros-accent hover:underline"
              >
                try a different email
              </button>
            </p>
            <div className="mt-6">
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-careeros-accent hover:bg-careeros-accent-hover text-black font-medium px-6"
              >
                Go to sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-careeros-bg px-4">
      <Card className="w-full max-w-md bg-careeros-surface border-careeros-border">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-careeros-accent to-[#F5A1C0] flex items-center justify-center">
              <span className="text-black font-bold text-lg">C</span>
            </div>
          </div>
          <CardTitle className="text-2xl text-careeros-text">Create your account</CardTitle>
          <CardDescription className="text-careeros-text-muted">
            Get AI-powered career intelligence in minutes
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSignUp}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-careeros-text">
                Full Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
                className="min-h-[48px] bg-careeros-bg border-careeros-border text-careeros-text placeholder:text-careeros-text-muted/50"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-careeros-text">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="min-h-[48px] bg-careeros-bg border-careeros-border text-careeros-text placeholder:text-careeros-text-muted/50"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-careeros-text">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
                className="min-h-[48px] bg-careeros-bg border-careeros-border text-careeros-text placeholder:text-careeros-text-muted/50"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full min-h-[48px] bg-careeros-accent hover:bg-careeros-accent-hover text-black font-medium"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
            <p className="text-sm text-careeros-text-muted text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-careeros-accent hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-careeros-bg">
        <Loader2 className="h-8 w-8 animate-spin text-careeros-accent" aria-hidden="true" />
      </div>
    }>
      <SignUpForm />
    </Suspense>
  )
}

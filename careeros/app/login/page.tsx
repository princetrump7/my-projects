"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { signIn } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await signIn(email, password)
      const redirect = searchParams.get("redirect")
      if (redirect === "extension") {
        router.push("/dashboard?redirect=extension")
      } else {
        router.push("/dashboard")
      }
    } catch (err) {
      toast({
        title: "Login failed",
        description: err instanceof Error ? err.message : "Invalid email or password",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
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
          <CardTitle className="text-2xl text-careeros-text">Welcome back</CardTitle>
          <CardDescription className="text-careeros-text-muted">Sign in to your CareerOS account</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
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
                placeholder="••••••••"
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
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
            <p className="text-sm text-careeros-text-muted text-center">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-careeros-accent hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-careeros-bg">
        <Loader2 className="h-8 w-8 animate-spin text-careeros-accent" aria-hidden="true" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { consumeSSE } from "@/lib/sse"

interface CareerDiagnosis {
  rejection_reasons: string[]
  top_skill_gaps: Record<string, number>
  market_keyword_frequency: Record<string, number>
  overall_assessment: string
}
import { Nav } from "@/components/nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import {
  Loader2,
  Stethoscope,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  RefreshCw,
  ArrowRight,
} from "lucide-react"

export default function DiagnosePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [latestResume, setLatestResume] = useState<any>(null)
  const [diagnosis, setDiagnosis] = useState<CareerDiagnosis | null>(null)
  const [existingDiagnosis, setExistingDiagnosis] = useState<any>(null)
  const [diagnosing, setDiagnosing] = useState(false)
  const [userTier, setUserTier] = useState("free")

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    const userId = user.id

    async function loadData() {
      try {
        const { data: userData } = await supabase
          .from("users")
          .select("subscription_tier")
          .eq("id", userId)
          .single()
        setUserTier((userData as any)?.subscription_tier || "free")

        // Get latest resume
        const { data: resume } = await supabase
          .from("resumes")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        if (resume) {
          setLatestResume(resume)

          // Check for existing diagnosis
          const { data: existingDiag } = await supabase
            .from("career_diagnosis")
            .select("*")
            .eq("user_id", userId)
            .order("diagnosed_at", { ascending: false })
            .limit(1)
            .single()

          if (existingDiag) {
            setExistingDiagnosis(existingDiag)
            setDiagnosis({
              rejection_reasons: existingDiag.rejection_reasons as string[],
              top_skill_gaps: existingDiag.top_skill_gaps as Record<string, number>,
              market_keyword_frequency: existingDiag.market_keyword_frequency as Record<string, number>,
              overall_assessment: existingDiag.overall_assessment || "",
            })
          }
        }
      } catch {
        // No data yet
      }
    }

    loadData()
  }, [user])

  const handleDiagnose = async () => {
    if (!latestResume) return

    setDiagnosing(true)

    try {
      const response = await fetch("/api/diagnose/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_id: latestResume.id }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || "Diagnosis failed")
      }

      let diagnoseError: string | null = null
      await consumeSSE(response, (event) => {
        switch (event.type) {
          case "progress":
            toast({ title: event.message as string })
            break
          case "result":
            setDiagnosis(event.result as CareerDiagnosis)
            break
          case "error":
            diagnoseError = event.message as string
            break
        }
      })

      if (diagnoseError) throw new Error(diagnoseError)

      toast({
        title: "Diagnosis complete!",
        description: "Your Career Truth report is ready.",
      })
    } catch (err) {
      toast({
        title: "Diagnosis failed",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setDiagnosing(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <Nav />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Career Truth Engine</h1>
            <p className="text-muted-foreground mt-1">
              Data-driven insights on your career position and what to fix
            </p>
          </div>
          <Button
            onClick={handleDiagnose}
            disabled={diagnosing || !latestResume}
            className="min-h-[44px]"
          >
            {diagnosing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
                Diagnosing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                {diagnosis ? "Re-diagnose" : "Run Diagnosis"}
              </>
            )}
          </Button>
        </div>

        {!latestResume && !diagnosis ? (
          <Card>
            <CardContent className="text-center py-12">
              <Stethoscope className="h-12 w-12 mx-auto text-muted-foreground mb-4" aria-hidden="true" />
              <h2 className="text-xl font-semibold mb-2">No CV Found</h2>
              <p className="text-muted-foreground mb-6">
                Upload a CV first to get your Career Truth diagnosis.
              </p>
              <Link href="/upload">
                <Button className="min-h-[44px]">Upload CV</Button>
              </Link>
            </CardContent>
          </Card>
        ) : diagnosing ? (
          <Card>
            <CardContent className="text-center py-16">
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary mb-4" aria-hidden="true" />
              <h2 className="text-xl font-semibold mb-2">Analyzing Your Profile</h2>
              <p className="text-muted-foreground">
                CareerOS AI is analyzing your CV against job market data...
              </p>
            </CardContent>
          </Card>
        ) : diagnosis ? (
          <div className="space-y-6">
            {/* Overall Assessment */}
            <Card className="border-purple-200 bg-purple-50/30">
              <CardHeader>
                <CardTitle className="text-lg">Overall Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{diagnosis.overall_assessment}</p>
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Rejection Reasons */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" aria-hidden="true" />
                    <CardTitle className="text-lg">Rejection Reasons</CardTitle>
                  </div>
                  <CardDescription>Why your CV might be getting rejected</CardDescription>
                </CardHeader>
                <CardContent>
                  {diagnosis.rejection_reasons.length > 0 ? (
                    <ul className="space-y-3">
                      {diagnosis.rejection_reasons.map((reason, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-red-500 mt-0.5 shrink-0">•</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No rejection patterns detected.</p>
                  )}
                </CardContent>
              </Card>

              {/* Top Skill Gaps */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-careeros-accent" aria-hidden="true" />
                    <CardTitle className="text-lg">Top Skill Gaps</CardTitle>
                  </div>
                  <CardDescription>Skills with highest market demand</CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.keys(diagnosis.top_skill_gaps).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(diagnosis.top_skill_gaps)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 8)
                        .map(([skill, weight]) => (
                          <div key={skill}>
                            <div className="flex justify-between text-sm mb-1">
                              <span>{skill}</span>
                              <span className="text-muted-foreground">
                                {Math.round(weight)}%
                              </span>
                            </div>
                            <Progress value={weight} />
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No skill gaps identified.</p>
                  )}
                </CardContent>
              </Card>

              {/* Market Keyword Frequency */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-500" aria-hidden="true" />
                    <CardTitle className="text-lg">Market Keywords</CardTitle>
                  </div>
                  <CardDescription>In-demand keywords in your field</CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.keys(diagnosis.market_keyword_frequency).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(diagnosis.market_keyword_frequency)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 10)
                        .map(([keyword, freq]) => (
                          <div
                            key={keyword}
                            className="flex items-center justify-between p-2 rounded-md border"
                          >
                            <span className="text-sm">{keyword}</span>
                            <Badge variant="secondary">{freq}</Badge>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No market keyword data available.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Next Steps */}
            <Card>
              <CardContent className="flex flex-col sm:flex-row gap-3 pt-6">
                <Link href="/optimize" className="flex-1">
                  <Button className="w-full min-h-[48px]" size="lg">
                    Optimize Your CV
                    <ArrowRight className="h-5 w-5 ml-2" aria-hidden="true" />
                  </Button>
                </Link>
                <Link href="/jobs" className="flex-1">
                  <Button variant="outline" className="w-full min-h-[48px]" size="lg">
                    Match a Job
                    <ArrowRight className="h-5 w-5 ml-2" aria-hidden="true" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </main>
    </div>
  )
}

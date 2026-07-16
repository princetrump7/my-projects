"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { consumeSSE } from "@/lib/sse"

interface AnalysisResult {
  interview_probability_score: number
  weaknesses: string[]
  missing_keywords: string[]
  skill_gaps: Record<string, number>
  optimized_text: string
}
import { Nav } from "@/components/nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Target,
  ArrowRight,
  FileEdit,
  RefreshCw,
} from "lucide-react"

export default function AnalyzePageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    }>
      <AnalyzePage />
    </Suspense>
  )
}

function AnalyzePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const resumeId = searchParams.get("resume_id")

  const [resumeData, setResumeData] = useState<any>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previousAnalyses, setPreviousAnalyses] = useState<any[]>([])

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    const userId = user.id

    // Fetch all previous analyses
    async function fetchPrevious() {
      const { data } = await supabase
        .from("resume_analyses")
        .select("id, interview_probability_score, resumes!inner(filename), created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5)

      if (data) setPreviousAnalyses(data)
    }
    fetchPrevious()
  }, [user])

  useEffect(() => {
    if (!resumeId || !user) return
    const userId = user.id

    async function loadResume() {
      const { data, error } = await supabase
        .from("resumes")
        .select("*")
        .eq("id", resumeId)
        .eq("user_id", userId)
        .single()

      if (error) {
        setError("Resume not found")
        return
      }
      setResumeData(data)

      // Check if already analyzed
      const { data: existingAnalysis } = await supabase
        .from("resume_analyses")
        .select("*")
        .eq("resume_id", resumeId)
        .single()

      if (existingAnalysis) {
        setAnalysis({
          interview_probability_score: existingAnalysis.interview_probability_score,
          weaknesses: existingAnalysis.weaknesses as string[] || [],
          missing_keywords: existingAnalysis.missing_keywords as string[] || [],
          skill_gaps: (existingAnalysis.skill_gaps as Record<string, number>) || {},
          optimized_text: existingAnalysis.optimized_text || "",
        })
        return
      }

      // Run analysis
      runAnalysis(data)
    }

    if (resumeId) loadResume()
  }, [resumeId, user])

  const runAnalysis = async (resume: any) => {
    if (!user) return

    setAnalyzing(true)
    setError(null)

    try {
      const response = await fetch("/api/analyze/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_id: resume.id }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || "Analysis failed")
      }

      await consumeSSE(response, (event) => {
        switch (event.type) {
          case "progress":
            toast({ title: event.message as string })
            break
          case "result":
            setAnalysis(event.result as AnalysisResult)
            break
          case "error":
            setError(event.message as string)
            break
        }
      })

      if (!error) {
        toast({
          title: "Analysis complete!",
          description: "Your CV has been analyzed by CareerOS AI.",
        })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Analysis failed"
      setError(msg)
      toast({ title: "Analysis failed", description: msg, variant: "destructive" })
    } finally {
      setAnalyzing(false)
    }
  }

  const handleReAnalyze = async () => {
    if (!resumeData) return
    setAnalysis(null)
    await runAnalysis(resumeData)
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    )
  }

  const scoreColor =
    analysis && analysis.interview_probability_score >= 70
      ? "text-green-500"
      : analysis && analysis.interview_probability_score >= 40
        ? "text-yellow-500"
        : "text-red-500"

  return (
    <div className="min-h-screen bg-muted/20">
      <Nav />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">CV Analysis</h1>
            <p className="text-muted-foreground mt-1">
              {resumeData?.filename ? `Analyzing: ${resumeData.filename}` : "AI-powered CV review"}
            </p>
          </div>
          <div className="flex gap-2">
            {analysis && (
              <Button variant="outline" onClick={handleReAnalyze} disabled={analyzing} className="min-h-[44px]">
                <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                Re-analyze
              </Button>
            )}
            <Link href="/upload">
              <Button className="min-h-[44px]">
                <FileEdit className="h-4 w-4 mr-2" aria-hidden="true" />
                Upload New CV
              </Button>
            </Link>
          </div>
        </div>

        {/* No resume selected */}
        {!resumeId && !analyzing && !analysis && (
          <Card>
            <CardContent className="text-center py-12">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" aria-hidden="true" />
              <h2 className="text-xl font-semibold mb-2">No CV Selected</h2>
              <p className="text-muted-foreground mb-6">
                Upload a CV first to get an AI-powered analysis.
              </p>
              <Link href="/upload">
                <Button>Upload CV</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Analyzing */}
        {analyzing && (
          <Card>
            <CardContent className="text-center py-12">
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary mb-4" aria-hidden="true" />
              <h2 className="text-xl font-semibold mb-2">Analyzing Your CV</h2>
              <p className="text-muted-foreground">
                CareerOS AI is reviewing your CV against job market data...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && !analyzing && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="text-center py-8">
              <AlertTriangle className="h-8 w-8 mx-auto text-red-500 mb-3" aria-hidden="true" />
              <h2 className="text-lg font-semibold mb-2">Analysis Error</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={handleReAnalyze} className="min-h-[44px]">Try Again</Button>
            </CardContent>
          </Card>
        )}

        {/* Analysis Results */}
        {analysis && !analyzing && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Score */}
            <Card className="lg:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle>Interview Probability Score</CardTitle>
                <CardDescription>
                  How likely is this CV to get you an interview?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="text-6xl font-bold">
                    <span className={scoreColor}>{analysis.interview_probability_score}%</span>
                  </div>
                  <div className="flex-1">
                    <Progress value={analysis.interview_probability_score} className="h-4" />
                    <p className="text-sm text-muted-foreground mt-2">
                      {analysis.interview_probability_score >= 70
                        ? "Great CV! Small tweaks can make it even stronger."
                        : analysis.interview_probability_score >= 40
                          ? "Room for improvement. See recommendations below."
                          : "Needs significant improvement. Focus on the weaknesses listed."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weaknesses */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" aria-hidden="true" />
                  <CardTitle className="text-lg">Weaknesses</CardTitle>
                </div>
                <CardDescription>Critical areas to improve</CardDescription>
              </CardHeader>
              <CardContent>
                {analysis.weaknesses.length > 0 ? (
                  <ul className="space-y-2">
                    {analysis.weaknesses.map((w, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No significant weaknesses detected.</p>
                )}
              </CardContent>
            </Card>

            {/* Missing Keywords */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-careeros-accent" aria-hidden="true" />
                  <CardTitle className="text-lg">Missing Keywords</CardTitle>
                </div>
                <CardDescription>Keywords from your target roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis.missing_keywords.length > 0 ? (
                    analysis.missing_keywords.map((kw, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {kw}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No missing keywords detected.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Skill Gaps */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-500" aria-hidden="true" />
                  <CardTitle className="text-lg">Skill Gaps</CardTitle>
                </div>
                <CardDescription>Skills to develop for better opportunities</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(analysis.skill_gaps).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(analysis.skill_gaps)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 6)
                      .map(([skill, weight]) => (
                        <div key={skill}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{skill}</span>
                            <span className="text-muted-foreground">{Math.round(weight)}%</span>
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

            {/* Action buttons */}
            <Card className="lg:col-span-3">
              <CardContent className="flex flex-col sm:flex-row gap-3 pt-6">
                <Link href="/optimize" className="flex-1">
                  <Button className="w-full min-h-[48px]" size="lg">
                    <FileEdit className="h-5 w-5 mr-2" aria-hidden="true" />
                    Optimize This CV
                    <ArrowRight className="h-5 w-5 ml-2" aria-hidden="true" />
                  </Button>
                </Link>
                <Link href="/diagnose" className="flex-1">
                  <Button variant="outline" className="w-full min-h-[48px]" size="lg">
                    <TrendingUp className="h-5 w-5 mr-2" aria-hidden="true" />
                    Full Career Diagnosis
                    <ArrowRight className="h-5 w-5 ml-2" aria-hidden="true" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Previous analyses */}
            {previousAnalyses.length > 0 && (
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle className="text-lg">Previous Analyses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {previousAnalyses.map((a) => (
                      <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="text-sm font-medium">{a.resumes?.filename || "CV"}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(a.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={a.interview_probability_score >= 50 ? "success" : "warning"}>
                          {a.interview_probability_score}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

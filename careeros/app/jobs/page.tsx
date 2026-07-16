"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { consumeSSE } from "@/lib/sse"

interface JobMatchResult {
  match_score: number
  missing_skills: string[]
  competition_estimate: "low" | "medium" | "high"
  optimized_cv_suggestion: string
}
import { Nav } from "@/components/nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import {
  Loader2,
  Briefcase,
  Search,
  ArrowRight,
  Download,
  Target,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"

export default function JobsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Manual job entry
  const [jobTitle, setJobTitle] = useState("")
  const [jobCompany, setJobCompany] = useState("")
  const [jobDescription, setJobDescription] = useState("")

  const [matching, setMatching] = useState(false)
  const [result, setResult] = useState<JobMatchResult | null>(null)
  const [latestResume, setLatestResume] = useState<any>(null)
  const [previousMatches, setPreviousMatches] = useState<any[]>([])

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    const userId = user.id

    async function loadData() {
      // Get latest active resume
      const { data: resume } = await supabase
        .from("resumes")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (resume) setLatestResume(resume)

      // Get previous matches
      const { data: matches } = await supabase
        .from("job_matches")
        .select("id, match_score, competition_estimate, jobs!inner(title, company), created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10)

      if (matches) setPreviousMatches(matches)
    }

    loadData()
  }, [user])

  const handleMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!latestResume || !jobTitle || !jobDescription) {
      toast({
        title: "Missing fields",
        description: "Please provide a job title and description.",
        variant: "destructive",
      })
      return
    }

    setMatching(true)
    setResult(null)

    try {
      const response = await fetch("/api/match/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_id: latestResume.id,
          job_title: jobTitle,
          job_company: jobCompany || "Unknown Company",
          job_description: jobDescription,
        }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || "Job matching failed")
      }

      let matchError: string | null = null
      await consumeSSE(response, (event) => {
        switch (event.type) {
          case "progress":
            toast({ title: event.message as string })
            break
          case "result": {
            const r = event.result as JobMatchResult
            setResult(r)
            toast({
              title: "Match complete!",
              description: `Score: ${r.match_score}% — ${r.competition_estimate} competition`,
            })
            break
          }
          case "error":
            matchError = event.message as string
            break
        }
      })

      if (matchError) throw new Error(matchError)
    } catch (err) {
      toast({
        title: "Match failed",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setMatching(false)
    }
  }

  const handleDownloadOptimized = () => {
    if (!result?.optimized_cv_suggestion) return
    const blob = new Blob([result.optimized_cv_suggestion], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `optimized-for-${jobTitle.replace(/\s+/g, "-")}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    )
  }

  const competitionColor = {
    low: "success" as const,
    medium: "warning" as const,
    high: "destructive" as const,
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <Nav />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Job Matching</h1>
          <p className="text-muted-foreground mt-1">
            Compare your CV against any job and see your match score
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Input Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Job Details</CardTitle>
                <CardDescription>
                  Enter the job you want to match against
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleMatch} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Job Title</label>
                    <Input
                      placeholder="e.g. Software Engineer"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      required
                      disabled={matching}
                      className="min-h-[44px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company</label>
                    <Input
                      placeholder="e.g. Google"
                      value={jobCompany}
                      onChange={(e) => setJobCompany(e.target.value)}
                      disabled={matching}
                      className="min-h-[44px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Job Description</label>
                    <textarea
                      className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="Paste the full job description here..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      required
                      disabled={matching}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full min-h-[48px]"
                    disabled={matching || !latestResume}
                  >
                    {matching ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" aria-hidden="true" />
                        Matching...
                      </>
                    ) : (
                      <>
                        <Search className="h-5 w-5 mr-2" aria-hidden="true" />
                        Match My CV
                      </>
                    )}
                  </Button>
                  {!latestResume && (
                    <p className="text-xs text-muted-foreground text-center">
                      <Link href="/upload" className="text-primary hover:underline">
                        Upload a CV
                      </Link>{" "}
                      first to enable matching.
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-3 space-y-6">
            {/* Match Result */}
            {result && (
              <Card className="border-careeros-border">
                <CardHeader className="bg-careeros-accent/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Match Result</CardTitle>
                      <CardDescription>
                        {jobTitle} at {jobCompany || "Unknown Company"}
                      </CardDescription>
                    </div>
                    <Badge variant={competitionColor[result.competition_estimate]}>
                      {result.competition_estimate} competition
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {/* Score */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Match Score</span>
                      <span
                        className={
                          result.match_score >= 70
                            ? "text-green-500"
                            : result.match_score >= 40
                              ? "text-yellow-500"
                              : "text-red-500"
                        }
                      >
                        {result.match_score}%
                      </span>
                    </div>
                    <Progress value={result.match_score} className="h-4" />
                  </div>

                  {/* Missing Skills */}
                  <div>
                    <h3 className="font-medium mb-2">Missing Skills</h3>
                    {result.missing_skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {result.missing_skills.map((skill, i) => (
                          <Badge key={i} variant="destructive" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No missing skills — excellent match!
                      </p>
                    )}
                  </div>

                  {/* Optimized CV Suggestion */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">Optimized CV Suggestion</h3>
                      <Button variant="outline" size="sm" onClick={handleDownloadOptimized} className="min-h-[44px]">
                        <Download className="h-4 w-4 mr-1" aria-hidden="true" />
                        Download
                      </Button>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4 max-h-[250px] overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm font-sans">
                        {result.optimized_cv_suggestion}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Previous Matches */}
            {previousMatches.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Previous Matches</CardTitle>
                  <CardDescription>Your recent job matches</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {previousMatches.map((m: any) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {m.jobs?.title || "Untitled Role"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {m.jobs?.company || "Unknown"} ·{" "}
                            {new Date(m.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={
                              m.competition_estimate === "low"
                                ? "success"
                                : m.competition_estimate === "medium"
                                  ? "warning"
                                  : "destructive"
                            }
                            className="text-xs"
                          >
                            {m.competition_estimate}
                          </Badge>
                          <span className="text-lg font-bold">{m.match_score}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {!result && previousMatches.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" aria-hidden="true" />
                  <h2 className="text-xl font-semibold mb-2">No Matches Yet</h2>
                  <p className="text-muted-foreground">
                    Enter a job description on the left to see how your CV matches up.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Nav } from "@/components/nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Loader2, Upload, BarChart3, Briefcase, Target, TrendingUp, AlertTriangle, FileEdit, CreditCard, Stethoscope } from "lucide-react"

interface DashboardData {
  latestAnalysis?: {
    id: string
    interview_probability_score: number
    weaknesses: string[]
    created_at: string
  }
  topJobMatches: Array<{
    id: string
    match_score: number
    jobs: any
  }>
  latestDiagnosis?: {
    id: string
    top_skill_gaps: Record<string, number>
    created_at: string
  }
  resumeCount: number
  userTier: string
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    const userId = user.id

    async function fetchDashboard() {
      try {
        const [userData, analyses, matches, diagnoses, resumes] = await Promise.all([
          supabase.from("users").select("subscription_tier").eq("id", userId).single(),
          supabase
            .from("resume_analyses")
            .select("id, interview_probability_score, weaknesses, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(1),
          supabase
            .from("job_matches")
            .select("id, match_score, jobs!inner(title, company)")
            .eq("user_id", userId)
            .order("match_score", { ascending: false })
            .limit(3),
          supabase
            .from("career_diagnosis")
            .select("id, top_skill_gaps, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(1),
          supabase
            .from("resumes")
            .select("id", { count: "exact" })
            .eq("user_id", userId),
        ])

        setData({
          latestAnalysis: analyses.data?.[0] || undefined,
          topJobMatches: (matches.data || []).map((m: any) => ({
            id: m.id,
            match_score: m.match_score,
            jobs: Array.isArray(m.jobs) ? m.jobs[0] : m.jobs,
          })),
          latestDiagnosis: diagnoses.data?.[0] || undefined,
          resumeCount: resumes.count || 0,
          userTier: (userData.data as any)?.subscription_tier || "free",
        })
      } catch (err) {
        console.error("Dashboard fetch error:", err)
      } finally {
        setFetching(false)
      }
    }

    fetchDashboard()
  }, [user])

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
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={data?.userTier === "free" ? "secondary" : "default"}>
              {data?.userTier === "pro" ? "Pro" : data?.userTier === "premium" ? "Premium" : "Free"}
            </Badge>
            <Link href="/upload">
              <Button className="min-h-[44px]">
                <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
                Upload CV
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                CVs Uploaded
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data?.resumeCount || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Interview Probability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {data?.latestAnalysis ? `${data.latestAnalysis.interview_probability_score}%` : "—"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Job Matches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data?.topJobMatches.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Top Skill Gap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold truncate">
                {data?.latestDiagnosis
                  ? Object.keys(data.latestDiagnosis.top_skill_gaps)[0]?.slice(0, 12) || "—"
                  : "—"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column - Latest Analysis */}
          <div className="lg:col-span-2 space-y-6">
            {/* Latest Analysis */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Latest CV Analysis</CardTitle>
                  <CardDescription>
                    {data?.latestAnalysis
                      ? new Date(data.latestAnalysis.created_at).toLocaleDateString()
                      : "No analysis yet"}
                  </CardDescription>
                </div>
                <BarChart3 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                {data?.latestAnalysis ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">Interview Probability</span>
                        <span className={data.latestAnalysis.interview_probability_score < 50 ? "text-red-500" : "text-green-500"}>
                          {data.latestAnalysis.interview_probability_score}%
                        </span>
                      </div>
                      <Progress value={data.latestAnalysis.interview_probability_score} />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Key Weaknesses</h4>
                      <ul className="space-y-1">
                        {(data.latestAnalysis.weaknesses || []).slice(0, 3).map((w, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" aria-hidden="true" />
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link href="/analyze">
                      <Button variant="outline" size="sm" className="min-h-[44px]">View Full Analysis</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" aria-hidden="true" />
                    <p className="text-sm text-muted-foreground mb-4">Upload your first CV to get started</p>
                    <Link href="/upload">
                      <Button>Upload CV</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Job Matches */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Top Job Matches</CardTitle>
                  <CardDescription>Best-matching jobs from your analyses</CardDescription>
                </div>
                <Briefcase className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                {data?.topJobMatches.length ? (
                  <div className="space-y-4">
                    {data.topJobMatches.map((match) => (
                      <div key={match.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-medium text-sm">{(match.jobs as any).title}</p>
                          <p className="text-xs text-muted-foreground">{(match.jobs as any).company}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold">{match.match_score}%</span>
                          <p className="text-xs text-muted-foreground">match</p>
                        </div>
                      </div>
                    ))}
                    <Link href="/jobs">
                      <Button variant="outline" size="sm" className="w-full min-h-[44px]">Match More Jobs</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-8 w-8 mx-auto text-muted-foreground mb-3" aria-hidden="true" />
                    <p className="text-sm text-muted-foreground">No job matches yet. Upload a CV and try matching.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column - Skill Gaps + Quick Actions */}
          <div className="space-y-6">
            {/* Skill Gaps */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Skill Gaps</CardTitle>
                <CardDescription>Skills to develop for better opportunities</CardDescription>
              </CardHeader>
              <CardContent>
                {data?.latestDiagnosis ? (
                  <div className="space-y-3">
                    {Object.entries(data.latestDiagnosis.top_skill_gaps)
                      .slice(0, 5)
                      .map(([skill, weight]) => (
                        <div key={skill}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{skill}</span>
                            <span className="text-muted-foreground">{Math.round(weight)}%</span>
                          </div>
                          <Progress value={weight} />
                        </div>
                      ))}
                    <Link href="/diagnose">
                      <Button variant="outline" size="sm" className="w-full mt-2 min-h-[44px]">
                        <TrendingUp className="h-4 w-4 mr-2" aria-hidden="true" />
                        Full Career Diagnosis
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Stethoscope className="h-8 w-8 mx-auto text-muted-foreground mb-3" aria-hidden="true" />
                    <p className="text-sm text-muted-foreground">Run a Career Diagnosis to see skill gaps.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/upload">
                  <Button variant="outline" className="w-full justify-start min-h-[44px]">
                    <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
                    Upload New CV
                  </Button>
                </Link>
                <Link href="/optimize">
                  <Button variant="outline" className="w-full justify-start min-h-[44px]">
                    <FileEdit className="h-4 w-4 mr-2" aria-hidden="true" />
                    Optimize Last CV
                  </Button>
                </Link>
                <Link href="/jobs">
                  <Button variant="outline" className="w-full justify-start min-h-[44px]">
                    <Briefcase className="h-4 w-4 mr-2" aria-hidden="true" />
                    Match a Job
                  </Button>
                </Link>
                {(data?.userTier === "free") && (
                  <Link href="/payments">
                    <Button className="w-full justify-start min-h-[44px]">
                      <CreditCard className="h-4 w-4 mr-2" aria-hidden="true" />
                      Upgrade to Pro
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

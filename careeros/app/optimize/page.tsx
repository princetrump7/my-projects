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
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, FileEdit, Check, X, Download, CreditCard, RefreshCw } from "lucide-react"

export default function OptimizePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [latestResume, setLatestResume] = useState<any>(null)
  const [latestAnalysis, setLatestAnalysis] = useState<any>(null)
  const [originalText, setOriginalText] = useState("")
  const [optimizedText, setOptimizedText] = useState("")
  const [loadingData, setLoadingData] = useState(true)
  const [userTier, setUserTier] = useState("free")
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const [acceptedSections, setAcceptedSections] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    const userId = user.id

    async function loadData() {
      try {
        // Get user tier
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
          setOriginalText(resume.original_text)

          // Get latest analysis for this resume
          const { data: analysis } = await supabase
            .from("resume_analyses")
            .select("*")
            .eq("resume_id", resume.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single()

          if (analysis) {
            setLatestAnalysis(analysis)
            setOptimizedText(analysis.optimized_text || "")
          }
        }
      } catch (err) {
        console.error("Load error:", err)
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [user])

  const handleAcceptAll = () => {
    setAcceptedSections({ experience: true, education: true, summary: true })
    toast({
      title: "Changes accepted",
      description: "All optimizations have been applied.",
    })
  }

  const handleDownload = () => {
    const text = optimizedText || originalText
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `optimized-cv-${latestResume?.filename || "careeros"}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast({
      title: "Download started",
      description: "Your optimized CV is being downloaded.",
    })
  }

  const handleSaveVersion = async () => {
    if (!latestResume) return

    const newVersion = latestResume.version + 1
    const { error } = await supabase
      .from("resumes")
      .update({
        version: newVersion,
        original_text: optimizedText,
        parsed_json: latestResume.parsed_json,
      })
      .eq("id", latestResume.id)

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" })
    } else {
      toast({ title: "Version saved!", description: `Version ${newVersion} saved.` })
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    )
  }

  // Free tier upgrade check
  if (userTier === "free" && latestAnalysis) {
    return (
      <div className="min-h-screen bg-muted/20">
        <Nav />
        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <Card>
            <CardContent className="text-center py-12">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" aria-hidden="true" />
              <h2 className="text-xl font-semibold mb-2">Upgrade to Optimize</h2>
              <p className="text-muted-foreground mb-2">
                CV optimization is a Pro feature. Upgrade to get:
              </p>
              <ul className="text-sm text-left space-y-2 mb-6 mx-auto max-w-xs">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5" aria-hidden="true" />
                  Job-specific CV rewriting
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5" aria-hidden="true" />
                  Unlimited analyses
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5" aria-hidden="true" />
                  Advanced Career Truth insights
                </li>
              </ul>
              <Link href="/payments">
                <Button size="lg">Upgrade to Pro — GHS 60/month</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <Nav />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">CV Optimizer</h1>
            <p className="text-muted-foreground mt-1">
              Review and accept AI-powered optimizations for your CV
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={handleAcceptAll} className="min-h-[44px]">
              <Check className="h-4 w-4 mr-2" aria-hidden="true" />
              Accept All
            </Button>
            <Button variant="outline" onClick={handleSaveVersion} className="min-h-[44px]">
              <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
              Save Version
            </Button>
            <Button onClick={handleDownload} className="min-h-[44px]">
              <Download className="h-4 w-4 mr-2" aria-hidden="true" />
              Download
            </Button>
          </div>
        </div>

        {loadingData ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
          </div>
        ) : !latestResume ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileEdit className="h-12 w-12 mx-auto text-muted-foreground mb-4" aria-hidden="true" />
              <h2 className="text-xl font-semibold mb-2">No CV to Optimize</h2>
              <p className="text-muted-foreground mb-6">Upload and analyze a CV first.</p>
              <Link href="/upload">
                <Button className="min-h-[44px]">Upload CV</Button>
              </Link>
            </CardContent>
          </Card>
        ) : !optimizedText ? (
          <Card>
            <CardContent className="text-center py-12">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary mb-4" aria-hidden="true" />
              <h2 className="text-xl font-semibold mb-2">No Optimization Available</h2>
              <p className="text-muted-foreground mb-6">Run a CV analysis to get an optimized version.</p>
              <Link href={`/analyze?resume_id=${latestResume.id}`}>
                <Button className="min-h-[44px]">Analyze CV</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Original */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Original CV</CardTitle>
                <CardDescription>Your current version</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm font-sans bg-muted/30 rounded-lg p-4 max-h-[600px] overflow-y-auto">
                    {originalText}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Optimized */}
            <Card className="border-green-200">
              <CardHeader className="bg-green-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Optimized CV</CardTitle>
                    <CardDescription>AI-enhanced for better results</CardDescription>
                  </div>
                  <Badge variant="success">AI Optimized</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm font-sans bg-careeros-surface/50 rounded-lg p-4 max-h-[600px] overflow-y-auto">
                    {optimizedText}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}

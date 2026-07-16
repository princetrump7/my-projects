import { NextResponse } from "next/server"
import { getSupabaseUser } from "@/lib/supabase-server"
import { diagnoseCareer } from "@/lib/openai"
import { z } from "zod"

const RequestSchema = z.object({
  resume_id: z.string().uuid(),
})

export async function POST(req: Request) {
  try {
    const { user, supabase } = await getSupabaseUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = RequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid resume_id" }, { status: 400 })
    }

    // Fetch resume
    const { data: resume, error: resumeError } = await supabase
      .from("resumes")
      .select("*")
      .eq("id", parsed.data.resume_id)
      .eq("user_id", user.id)
      .single()

    if (resumeError || !resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 })
    }

    // Check existing diagnosis
    const { data: existing } = await supabase
      .from("career_diagnosis")
      .select("*")
      .eq("user_id", user.id)
      .order("diagnosed_at", { ascending: false })
      .limit(1)
      .single()

    if (existing) {
      return NextResponse.json({
        diagnosis: {
          rejection_reasons: existing.rejection_reasons,
          top_skill_gaps: existing.top_skill_gaps,
          market_keyword_frequency: existing.market_keyword_frequency,
          overall_assessment: existing.overall_assessment,
        },
      })
    }

    // Run diagnosis
    const result = await diagnoseCareer(resume.parsed_json)

    // Save to database
    await supabase.from("career_diagnosis").insert({
      user_id: user.id,
      resume_id: resume.id,
      rejection_reasons: result.rejection_reasons,
      top_skill_gaps: result.top_skill_gaps,
      market_keyword_frequency: result.market_keyword_frequency,
      overall_assessment: result.overall_assessment,
    })

    return NextResponse.json({ diagnosis: result })
  } catch (err) {
    console.error("Diagnose API error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Diagnosis failed" },
      { status: 500 }
    )
  }
}

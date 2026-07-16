import { NextResponse } from "next/server"
import { getSupabaseUser } from "@/lib/supabase-server"
import { analyzeCV } from "@/lib/openai"
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

    // Check existing analysis
    const { data: existing } = await supabase
      .from("resume_analyses")
      .select("*")
      .eq("resume_id", resume.id)
      .single()

    if (existing) {
      return NextResponse.json({
        analysis: {
          interview_probability_score: existing.interview_probability_score,
          weaknesses: existing.weaknesses,
          missing_keywords: existing.missing_keywords,
          skill_gaps: existing.skill_gaps,
          optimized_text: existing.optimized_text,
        },
      })
    }

    // Run analysis
    const result = await analyzeCV(resume.original_text, resume.parsed_json)

    // Save to database
    await supabase.from("resume_analyses").insert({
      resume_id: resume.id,
      user_id: user.id,
      interview_probability_score: result.interview_probability_score,
      weaknesses: result.weaknesses,
      missing_keywords: result.missing_keywords,
      skill_gaps: result.skill_gaps,
      optimized_text: result.optimized_text,
    })

    return NextResponse.json({ analysis: result })
  } catch (err) {
    console.error("Analyze API error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 }
    )
  }
}

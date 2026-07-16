import { NextResponse } from "next/server"
import { getSupabaseUser } from "@/lib/supabase-server"
import { matchJob } from "@/lib/openai"
import { z } from "zod"

const RequestSchema = z.object({
  resume_id: z.string().uuid(),
  job_title: z.string().min(1),
  job_company: z.string().optional(),
  job_description: z.string().min(10),
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
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
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

    // Run match
    const result = await matchJob(
      resume.parsed_json,
      parsed.data.job_title,
      parsed.data.job_company || "Unknown",
      parsed.data.job_description
    )

    // Save job
    const { data: job } = await supabase
      .from("jobs")
      .insert({
        user_id: user.id,
        title: parsed.data.job_title,
        company: parsed.data.job_company || "Unknown",
        description: parsed.data.job_description,
        required_skills: result.missing_skills,
      })
      .select()
      .single()

    // Save match
    if (job) {
      await supabase.from("job_matches").insert({
        job_id: job.id,
        resume_id: resume.id,
        user_id: user.id,
        match_score: result.match_score,
        missing_skills: result.missing_skills,
        competition_estimate: result.competition_estimate,
        optimized_cv_suggestion: result.optimized_cv_suggestion,
      })
    }

    return NextResponse.json({ match: result })
  } catch (err) {
    console.error("Match API error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Match failed" },
      { status: 500 }
    )
  }
}

import { NextResponse } from "next/server"
import { getSupabaseUser } from "@/lib/supabase-server"
import { sseResponse } from "@/lib/sse"
import { z } from "zod"

const RequestSchema = z.object({
  resume_id: z.string().uuid(),
  job_title: z.string().min(1),
  job_company: z.string().optional().default(""),
  job_description: z.string().min(1),
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
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    // Fetch resume
    const { data: resume } = await supabase
      .from("resumes")
      .select("parsed_json")
      .eq("id", parsed.data.resume_id)
      .eq("user_id", user.id)
      .single()

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 })
    }

    const { matchJobStream } = await import("@/lib/openai")

    const generate = async function* () {
      yield { type: "progress", message: "Matching CV against job description..." }

      const stream = await matchJobStream(
        resume.parsed_json,
        parsed.data.job_title,
        parsed.data.job_company,
        parsed.data.job_description
      )
      let fullText = ""

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || ""
        fullText += text
        if (text) {
          yield { type: "token", text }
        }
      }

      yield { type: "progress", message: "Finalizing match results..." }

      let result
      try {
        result = JSON.parse(fullText)
      } catch {
        yield { type: "error", message: "Failed to parse AI response" }
        return
      }

      const { JobMatchResultSchema } = await import("@/lib/openai")
      const validation = JobMatchResultSchema.safeParse(result)
      if (!validation.success) {
        yield { type: "error", message: "AI returned invalid match data" }
        return
      }

      // Save job
      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .insert({
          user_id: user.id,
          title: parsed.data.job_title,
          company: parsed.data.job_company || "Unknown",
          description: parsed.data.job_description,
          required_skills: validation.data.missing_skills,
        })
        .select()
        .single()

      if (jobError || !job) {
        console.error("Save job error:", jobError)
        yield { type: "error", message: "Failed to save job details" }
        return
      }

      // Save match
      const { error: insertError } = await supabase.from("job_matches").insert({
        job_id: job.id,
        resume_id: parsed.data.resume_id,
        user_id: user.id,
        match_score: validation.data.match_score,
        missing_skills: validation.data.missing_skills,
        competition_estimate: validation.data.competition_estimate,
        optimized_cv_suggestion: validation.data.optimized_cv_suggestion,
      })

      if (insertError) {
        console.error("Save match error:", insertError)
      }

      yield { type: "result", result: validation.data }
    }

    return sseResponse(generate())
  } catch (err) {
    console.error("Match stream error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Job matching failed" },
      { status: 500 }
    )
  }
}

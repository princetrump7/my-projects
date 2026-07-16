import { NextResponse } from "next/server"
import { getSupabaseUser } from "@/lib/supabase-server"
import { sseResponse } from "@/lib/sse"
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
      // Return cached result immediately
      return sseResponse(async function* () {
        yield { type: "result", result: existing }
      }())
    }

    // Stream OpenAI analysis
    const { analyzeCVStream } = await import("@/lib/openai")

    const generate = async function* () {
      yield { type: "progress", message: "Reading CV content..." }
      yield { type: "progress", message: "Analyzing against market data..." }

      const stream = await analyzeCVStream(resume.original_text, resume.parsed_json)
      let fullText = ""

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || ""
        fullText += text
        if (text) {
          yield { type: "token", text }
        }
      }

      yield { type: "progress", message: "Processing results..." }

      // Parse the result
      let result
      try {
        result = JSON.parse(fullText)
      } catch {
        yield { type: "error", message: "Failed to parse AI response" }
        return
      }

      // Validate with Zod
      const { AnalysisResultSchema } = await import("@/lib/openai")
      const validation = AnalysisResultSchema.safeParse(result)
      if (!validation.success) {
        yield { type: "error", message: "AI returned invalid data" }
        return
      }

      // Save to database
      const { error: insertError } = await supabase.from("resume_analyses").insert({
        resume_id: resume.id,
        user_id: user.id,
        interview_probability_score: validation.data.interview_probability_score,
        weaknesses: validation.data.weaknesses,
        missing_keywords: validation.data.missing_keywords,
        skill_gaps: validation.data.skill_gaps,
        optimized_text: validation.data.optimized_text,
      })

      if (insertError) {
        console.error("Save analysis error:", insertError)
      }

      yield { type: "result", result: validation.data }
    }

    return sseResponse(generate())
  } catch (err) {
    console.error("Analyze stream error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 }
    )
  }
}

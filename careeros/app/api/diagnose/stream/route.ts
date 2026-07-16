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
    const { data: resume } = await supabase
      .from("resumes")
      .select("parsed_json")
      .eq("id", parsed.data.resume_id)
      .eq("user_id", user.id)
      .single()

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 })
    }

    // Check existing diagnosis
    const { data: existing } = await supabase
      .from("career_diagnosis")
      .select("*")
      .eq("user_id", user.id)
      .order("diagnosed_at", { ascending: false })
      .limit(1)

    if (existing && existing.length > 0) {
      return sseResponse(async function* () {
        yield { type: "result", result: existing[0] }
      }())
    }

    const { diagnoseCareerStream } = await import("@/lib/openai")

    const generate = async function* () {
      yield { type: "progress", message: "Analyzing CV against market data..." }

      const stream = await diagnoseCareerStream(resume.parsed_json)
      let fullText = ""

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || ""
        fullText += text
        if (text) {
          yield { type: "token", text }
        }
      }

      yield { type: "progress", message: "Building your Career Truth profile..." }

      let result
      try {
        result = JSON.parse(fullText)
      } catch {
        yield { type: "error", message: "Failed to parse AI response" }
        return
      }

      const { CareerDiagnosisSchema } = await import("@/lib/openai")
      const validation = CareerDiagnosisSchema.safeParse(result)
      if (!validation.success) {
        yield { type: "error", message: "AI returned invalid diagnosis data" }
        return
      }

      // Save to database
      const { error: insertError } = await supabase.from("career_diagnosis").insert({
        user_id: user.id,
        resume_id: parsed.data.resume_id,
        rejection_reasons: validation.data.rejection_reasons,
        top_skill_gaps: validation.data.top_skill_gaps,
        market_keyword_frequency: validation.data.market_keyword_frequency,
        overall_assessment: validation.data.overall_assessment,
      })

      if (insertError) {
        console.error("Save diagnosis error:", insertError)
      }

      yield { type: "result", result: validation.data }
    }

    return sseResponse(generate())
  } catch (err) {
    console.error("Diagnose stream error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Diagnosis failed" },
      { status: 500 }
    )
  }
}

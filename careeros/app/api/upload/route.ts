import { NextRequest, NextResponse } from "next/server"
import { getSupabaseUser } from "@/lib/supabase-server"
import { parseCV } from "@/lib/parser"

export async function POST(req: NextRequest) {
  try {
    const { user, supabase } = await getSupabaseUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ]
    if (!allowedTypes.includes(file.type) && !file.name.endsWith(".docx") && !file.name.endsWith(".doc") && !file.name.endsWith(".pdf") && !file.name.endsWith(".txt")) {
      return NextResponse.json(
        { error: "Invalid file type. Supported: PDF, DOC, DOCX, TXT" },
        { status: 400 }
      )
    }

    // Validate size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 10MB." }, { status: 400 })
    }

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Parse CV
    const parsed = await parseCV(buffer, file.name)

    // Store resume in Supabase
    const { data: resume, error: resumeError } = await supabase
      .from("resumes")
      .insert({
        user_id: user.id,
        filename: file.name,
        original_text: parsed.original_text,
        parsed_json: parsed.parsed_json,
        version: 1,
      })
      .select()
      .single()

    if (resumeError) {
      return NextResponse.json({ error: "Failed to save resume" }, { status: 500 })
    }

    // Update or create profile
    await supabase.from("profiles").upsert(
      {
        user_id: user.id,
        full_name: parsed.parsed_json.name || null,
        parsed_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

    return NextResponse.json({
      success: true,
      resume_id: resume.id,
      filename: file.name,
      validation_errors: parsed.validation_errors,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    )
  }
}

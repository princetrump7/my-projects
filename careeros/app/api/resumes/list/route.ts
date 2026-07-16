import { NextResponse } from "next/server"
import { getSupabaseUser } from "@/lib/supabase-server"

export async function POST(req: Request) {
  try {
    const { user, supabase } = await getSupabaseUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: resumes, error } = await supabase
      .from("resumes")
      .select("id, filename, version, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("List resumes database error:", error)
      return NextResponse.json({ error: "Failed to load resumes" }, { status: 500 })
    }

    return NextResponse.json({ resumes })
  } catch (err) {
    console.error("List resumes error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load resumes" },
      { status: 500 }
    )
  }
}

import { NextResponse } from "next/server"
import { getSupabaseUser } from "@/lib/supabase-server"
import { createPayment } from "@/lib/paystack"
import { z } from "zod"

const RequestSchema = z.object({
  tier: z.enum(["free", "pro", "premium"]),
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
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 })
    }

    const { tier } = parsed.data

    if (tier === "free") {
      return NextResponse.json({ error: "Cannot upgrade to Free" }, { status: 400 })
    }

    // Create Paystack payment
    const result = await createPayment(user.email!, tier)

    return NextResponse.json({
      authorization_url: result.authorization_url,
      reference: result.reference,
    })
  } catch (err) {
    console.error("Payment create error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Payment initialization failed" },
      { status: 500 }
    )
  }
}

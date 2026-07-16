import { NextResponse } from "next/server"
import { getSupabaseUser } from "@/lib/supabase-server"
import { verifyPayment } from "@/lib/paystack"
import { z } from "zod"

const RequestSchema = z.object({
  reference: z.string().min(1),
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
      return NextResponse.json({ error: "Invalid reference" }, { status: 400 })
    }

    // Verify payment with Paystack
    const result = await verifyPayment(parsed.data.reference)

    if (result.status === "success" && result.tier) {
      // Update user's subscription tier
      await supabase
        .from("users")
        .update({ subscription_tier: result.tier })
        .eq("id", user.id)

      return NextResponse.json({
        success: true,
        tier: result.tier,
      })
    }

    return NextResponse.json({
      success: false,
      message: "Payment verification failed",
    })
  } catch (err) {
    console.error("Payment verify error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Verification failed" },
      { status: 500 }
    )
  }
}

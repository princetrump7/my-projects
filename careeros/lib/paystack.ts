import { supabase } from "./supabase"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!

// Subscription tiers
export const TIERS = {
  free: { name: "Free", amount: 0, label: "Free" },
  pro: { name: "Pro", amount: 6000, label: "Pro" }, // 60 GHS (in pesewas)
  premium: { name: "Premium", amount: 18000, label: "Premium" }, // 180 GHS (in pesewas)
} as const

export type TierKey = keyof typeof TIERS

interface PaystackInitResponse {
  status: boolean
  message: string
  data?: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

interface PaystackVerifyResponse {
  status: boolean
  message: string
  data?: {
    status: string
    reference: string
    amount: number
    metadata?: {
      tier?: string
      tier_name?: string
    }
    customer: {
      email: string
      customer_code: string
    }
  }
}

export async function createPayment(
  email: string,
  tier: TierKey
): Promise<{ authorization_url: string; reference: string }> {
  const tierConfig = TIERS[tier]

  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: tierConfig.amount,
      currency: "GHS",
      metadata: {
        tier,
        tier_name: tierConfig.label,
      },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/callback`,
    }),
  })

  const result: PaystackInitResponse = await response.json()

  if (!result.status || !result.data) {
    throw new Error(result.message || "Failed to initialize payment")
  }

  return {
    authorization_url: result.data.authorization_url,
    reference: result.data.reference,
  }
}

export async function verifyPayment(
  reference: string
): Promise<{ status: "success" | "failed"; tier: TierKey | null }> {
  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    }
  )

  const result: PaystackVerifyResponse = await response.json()

  if (!result.status || !result.data) {
    return { status: "failed", tier: null }
  }

  const paymentStatus = result.data.status === "success" ? "success" : "failed"
  const tier = result.data.metadata?.tier as TierKey | undefined

  return {
    status: paymentStatus,
    tier: tier || null,
  }
}

export async function updateUserTier(
  userId: string,
  tier: TierKey,
  customerCode?: string
): Promise<void> {
  const updateData: Record<string, string> = {
    subscription_tier: tier,
  }
  if (customerCode) {
    updateData.paystack_customer_id = customerCode
  }

  const { error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", userId)

  if (error) throw error
}

export async function createSubscription(
  email: string,
  tier: TierKey,
  authorizationCode: string
): Promise<{ subscription_code: string }> {
  // Find plan code or create one
  const planCode = await getOrCreatePlan(tier)

  const response = await fetch("https://api.paystack.co/subscription", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customer: email,
      plan: planCode,
      authorization: authorizationCode,
    }),
  })

  const result = await response.json()

  if (!result.status) {
    throw new Error(result.message || "Failed to create subscription")
  }

  return { subscription_code: result.data.subscription_code }
}

async function getOrCreatePlan(tier: TierKey): Promise<string> {
  const tierConfig = TIERS[tier]
  if (tier === "free") return ""

  // List existing plans
  const listResponse = await fetch("https://api.paystack.co/plan", {
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
  })
  const plans = await listResponse.json()

  const existingPlan = plans.data?.find(
    (p: any) => p.name === `CareerOS ${tierConfig.label}` && p.amount === tierConfig.amount
  )

  if (existingPlan) return existingPlan.plan_code

  // Create new plan
  const createResponse = await fetch("https://api.paystack.co/plan", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `CareerOS ${tierConfig.label}`,
      amount: tierConfig.amount,
      interval: "monthly",
      currency: "GHS",
    }),
  })

  const result = await createResponse.json()
  if (!result.status) throw new Error(result.message || "Failed to create plan")
  return result.data.plan_code
}

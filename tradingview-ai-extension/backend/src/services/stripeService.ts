import type { TierType, CheckoutSessionRequest, CheckoutSessionResponse } from '../types/index.js'

// ─── Subscription data storage (in-memory — extendable to DB) ──────

interface SubscriptionRecord {
  userId: string
  tier: TierType
  stripeCustomerId: string
  stripeSubscriptionId: string
  status: 'active' | 'past_due' | 'canceled' | 'incomplete'
  currentPeriodEnd: number | null
  createdAt: string
}

const subscriptions = new Map<string, SubscriptionRecord>()

// ─── Stripe Configuration ──────────────────────────────────────────

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? ''
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? ''

// Price IDs — must be created in Stripe Dashboard
const PRICE_IDS: Record<string, string> = {
  starter: '',  // Set via env or Stripe dashboard
  pro: '',
  elite: '',
}

// ─── Stripe Lazy Init ──────────────────────────────────────────────

let stripeClient: import('stripe').Stripe | null = null

function getStripe(): import('stripe').Stripe {
  if (!stripeClient) {
    const Stripe = require('stripe') as typeof import('stripe').default
    stripeClient = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    })
  }
  return stripeClient
}

function isStripeConfigured(): boolean {
  return !!STRIPE_SECRET_KEY && STRIPE_SECRET_KEY.startsWith('sk_')
}

// ─── Checkout Session ──────────────────────────────────────────────

export async function createCheckoutSession(
  req: CheckoutSessionRequest,
): Promise<CheckoutSessionResponse> {
  if (!isStripeConfigured()) {
    throw Object.assign(new Error('Stripe is not configured. Set STRIPE_SECRET_KEY in .env'), { statusCode: 503 })
  }

  const stripe = getStripe()
  const priceId = PRICE_IDS[req.tier] || await getOrCreatePrice(req.tier)

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: req.userId,
    success_url: req.successUrl,
    cancel_url: req.cancelUrl,
    metadata: { userId: req.userId, tier: req.tier },
  })

  return {
    url: session.url ?? '',
    sessionId: session.id,
  }
}

// ─── Webhook Handler ───────────────────────────────────────────────

export async function handleStripeWebhook(
  body: string,
  signature: string,
): Promise<{ received: boolean }> {
  if (!isStripeConfigured() || !STRIPE_WEBHOOK_SECRET) {
    console.warn('[stripe] Webhook received but Stripe not configured')
    return { received: true }
  }

  const stripe = getStripe()
  const event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Record<string, unknown>
      const userId = (session.metadata as Record<string, string>)?.['userId'] ?? session.client_reference_id as string
      const tier = (session.metadata as Record<string, string>)?.['tier'] ?? 'pro'
      const customerId = session.customer as string
      const subscriptionId = session.subscription as string

      if (userId && customerId) {
        subscriptions.set(userId, {
          userId,
          tier: tier as TierType,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          status: 'active',
          currentPeriodEnd: null,
          createdAt: new Date().toISOString(),
        })
        console.log(`[stripe] Subscription created for user ${userId} (${tier})`)
      }
      break
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Record<string, unknown>
      const customerId = sub.customer as string

      // Find subscription by customer ID
      for (const [, record] of subscriptions) {
        if (record.stripeCustomerId === customerId) {
          record.status = (sub.status as SubscriptionRecord['status']) ?? 'canceled'
          record.currentPeriodEnd = (sub.current_period_end as number) ?? null
          console.log(`[stripe] Subscription updated for ${record.userId}: ${record.status}`)
          break
        }
      }
      break
    }
  }

  return { received: true }
}

// ─── Subscription Lookup ───────────────────────────────────────────

export function getSubscription(userId: string): SubscriptionRecord | null {
  return subscriptions.get(userId) ?? null
}

// ─── Helper: Get or Create Price ───────────────────────────────────

async function getOrCreatePrice(tier: TierType): Promise<string> {
  if (PRICE_IDS[tier]) return PRICE_IDS[tier]

  const prices: Record<TierType, { name: string; amount: number }> = {
    free: { name: 'Free', amount: 0 },
    starter: { name: 'Starter', amount: 1500 },
    pro: { name: 'Pro', amount: 2900 },
    elite: { name: 'Elite', amount: 9900 },
  }

  const cfg = prices[tier]
  if (!cfg || cfg.amount <= 0) return ''

  const stripe = getStripe()
  const product = await stripe.products.create({
    name: `TradingView AI Copilot - ${cfg.name}`,
    metadata: { tier },
  })

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: cfg.amount,
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { tier },
  })

  PRICE_IDS[tier] = price.id
  return price.id
}

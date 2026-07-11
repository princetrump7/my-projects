import { Router, type Request, type Response, type NextFunction } from 'express'
import { createCheckoutSession, handleStripeWebhook } from '../services/stripeService.js'
import type { CheckoutSessionRequest } from '../types/index.js'

const router = Router()

/**
 * POST /api/stripe/create-checkout-session
 * Creates a Stripe Checkout session for the given tier.
 *
 * Body: { tier, userId, successUrl, cancelUrl }
 */
router.post('/create-checkout-session', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tier, userId, successUrl, cancelUrl } = req.body as CheckoutSessionRequest

    if (!tier || !userId) {
      res.status(400).json({ error: 'Missing required fields: tier, userId' })
      return
    }

    const session = await createCheckoutSession({ tier, userId, successUrl, cancelUrl })
    res.json(session)
  } catch (err: unknown) {
    const error = err as Error & { statusCode?: number }
    if (error.statusCode === 503) {
      res.status(503).json({ error: error.message })
      return
    }
    next(err)
  }
})

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events (subscription lifecycle).
 * Raw body required for signature verification.
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['stripe-signature']
    if (!signature) {
      res.status(400).json({ error: 'Missing stripe-signature header' })
      return
    }

    const result = await handleStripeWebhook(
      JSON.stringify(req.body),
      signature as string,
    )
    res.json(result)
  } catch (err) {
    console.error('[stripe] Webhook error:', err)
    res.status(400).json({ error: 'Webhook processing failed' })
  }
})

export default router

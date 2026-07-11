import { Router } from 'express'

const router = Router()

/**
 * GET /health
 * Returns server status and configuration info.
 */
router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    groqConfigured: !!process.env.GROQ_API_KEY,
    stripeConfigured: !!process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_'),
  })
})

export default router

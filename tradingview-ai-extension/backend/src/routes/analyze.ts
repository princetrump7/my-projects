import { Router, type Request, type Response, type NextFunction } from 'express'
import { analyzeTradingChart } from '../services/aiRouter.js'
import { validateAnalyzeRequest } from '../middleware/validateRequest.js'
import type { AnalyzeRequestBody } from '../types/index.js'

const router = Router()

/**
 * POST /api/analyze
 * Analyzes a chart image and returns structured trading signals.
 *
 * Body: { image (base64), context, market, tier, userId }
 */
router.post('/', validateAnalyzeRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { image, context, market, tier } = req.body as AnalyzeRequestBody
    const currentTier = tier ?? 'free'

    const result = await analyzeTradingChart(image, context, {
      market: market ?? 'XAUUSD',
      tier: currentTier,
    })

    // Mock remaining count — real quota handled by extension
    const remaining = currentTier === 'pro' || currentTier === 'elite'
      ? Infinity
      : currentTier === 'starter' ? 99 : 4

    res.json({
      result: { ...result, remaining },
      remaining,
    })
  } catch (err) {
    next(err)
  }
})

export default router

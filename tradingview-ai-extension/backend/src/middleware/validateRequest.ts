import type { Request, Response, NextFunction } from 'express'
import { createError } from './errorHandler.js'

/**
 * Validates the analyze request body.
 * Checks for: image presence, valid context shape.
 */
export function validateAnalyzeRequest(req: Request, _res: Response, next: NextFunction): void {
  const { image, context } = req.body

  if (!image) {
    return next(createError('Missing required field: image (base64 chart screenshot)', 400))
  }

  if (!context || typeof context !== 'object') {
    return next(createError('Missing required field: context (chart context object)', 400))
  }

  if (!context.symbol || typeof context.symbol !== 'string') {
    return next(createError('context.symbol is required', 400))
  }

  // Image should be a base64 string (may have data: prefix)
  if (typeof image !== 'string' || image.length < 100) {
    return next(createError('Invalid image: must be a base64-encoded PNG string', 400))
  }

  next()
}

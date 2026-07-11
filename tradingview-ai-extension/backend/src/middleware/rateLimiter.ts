import type { Request, Response, NextFunction } from 'express'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const ipMap = new Map<string, RateLimitEntry>()

const WINDOW_MS = 60_000 // 1 minute
const MAX_REQUESTS = 30   // 30 requests per minute per IP

/**
 * Simple in-memory rate limiter.
 * NOTE: In production, use a Redis-based solution for multi-process support.
 */
export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown'
  const now = Date.now()

  let entry = ipMap.get(ip)

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS }
    ipMap.set(ip, entry)
  }

  entry.count++

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS)
  res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - entry.count))
  res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000))

  if (entry.count > MAX_REQUESTS) {
    res.status(429).json({
      error: 'Too many requests. Please slow down.',
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    })
    return
  }

  next()
}

/**
 * Periodic cleanup of stale entries to prevent memory leaks.
 */
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of ipMap.entries()) {
    if (now > entry.resetAt) {
      ipMap.delete(ip)
    }
  }
}, 60_000)

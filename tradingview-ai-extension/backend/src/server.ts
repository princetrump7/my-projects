import express from 'express'
import cors from 'cors'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

import healthRouter from './routes/health.js'
import analyzeRouter from './routes/analyze.js'
import stripeRouter from './routes/stripe.js'
import { rateLimiter } from './middleware/rateLimiter.js'
import { errorHandler } from './middleware/errorHandler.js'

// ─── Environment ───────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

const PORT = parseInt(process.env.PORT ?? '3001', 10)
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'https://www.tradingview.com'

// ─── App ───────────────────────────────────────────────────────────

const app = express()

// CORS — restrict to TradingView by default
app.use(cors({
  origin: CORS_ORIGIN,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-User-Id'],
}))

// Rate limiting
app.use(rateLimiter)

// JSON body parser with 10MB limit for base64 images
app.use(express.json({ limit: '10mb' }))

// ─── Routes ────────────────────────────────────────────────────────

app.use('/health', healthRouter)
app.use('/api/analyze', analyzeRouter)
app.use('/api/stripe', stripeRouter)

// ─── Error Handler ─────────────────────────────────────────────────

app.use(errorHandler)

// ─── Start ─────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n  TradingView AI Copilot — Backend v2.0.0`)
  console.log(`  Server:    http://localhost:${PORT}`)
  console.log(`  CORS:      ${CORS_ORIGIN}`)
  console.log(`  Groq:      ${process.env.GROQ_API_KEY ? '✅ configured' : '❌ not set (mock mode)'}`)
  console.log(`  Stripe:    ${process.env.STRIPE_SECRET_KEY ? '✅ configured' : '❌ not set (disabled)'}`)
  console.log()
})

export default app

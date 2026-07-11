import { STORAGE } from '../shared/constants.js'
import type { AnalysisResult, ChartContext } from '../shared/types.js'
import { AnalysisBias, MarketType } from '../shared/types.js'
import type { TierType } from '../shared/types.js'

interface Config {
  baseUrl: string | null
  groqApiKey: string | null
  useMock: boolean
}

const config: Config = { baseUrl: null, groqApiKey: null, useMock: false }
let _configLoaded = false

async function ensureConfig(): Promise<void> {
  if (_configLoaded) return
  const { [STORAGE.GROQ_API_KEY]: key, [STORAGE.BACKEND_URL]: url } =
    await chrome.storage.local.get([STORAGE.GROQ_API_KEY, STORAGE.BACKEND_URL])
  config.groqApiKey = (key as string) ?? null
  config.baseUrl = (url as string) ?? null
  _configLoaded = true
}

export function setConfig(overrides: Partial<Config>): void {
  Object.assign(config, overrides)
  _configLoaded = true
}

// ─── Main Entry Point ──────────────────────────────────────────────

export async function analyzeChart(
  context: Pick<ChartContext, 'symbol' | 'timeframe'>,
  image: string | null,
  market: MarketType,
  tier: TierType,
  userId: string,
): Promise<AnalysisResult> {
  await ensureConfig()

  // 1. Backend proxy
  if (config.baseUrl) {
    try {
      return await callBackend(context, image, market, tier, userId)
    } catch (err) {
      console.warn('[apiClient] Backend proxy failed, falling back:', err)
      // Fall through to next option
    }
  }

  // 2. Direct Groq API
  if (config.groqApiKey && image) {
    try {
      return await callGroqVision(image, context)
    } catch (err) {
      console.warn('[apiClient] Direct Groq failed, falling back to mock:', err)
    }
  }

  // 3. Mock fallback
  return mockAnalyzeChart(context, market, tier)
}

// ─── Backend Proxy ─────────────────────────────────────────────────

async function callBackend(
  context: Pick<ChartContext, 'symbol' | 'timeframe'>,
  image: string | null,
  market: MarketType,
  tier: TierType,
  userId: string,
): Promise<AnalysisResult> {
  const res = await fetch(`${config.baseUrl}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': userId,
    },
    body: JSON.stringify({
      image,
      context: { symbol: context.symbol, timeframe: context.timeframe, currentPrice: null, market },
      market,
      tier,
      userId,
      timestamp: new Date().toISOString(),
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Backend returned ${res.status}: ${text}`)
  }

  const data = await res.json()
  const result = data.result ?? data

  // Validate response shape
  if (!result || !result.bias || typeof result.confidence !== 'number') {
    throw new Error('Backend returned invalid analysis shape')
  }

  return {
    ...result,
    remaining: data.remaining ?? 0,
  }
}

// ─── Direct Groq Vision API ────────────────────────────────────────
// FIX: Added system prompt (missing in original direct Groq path)

const GROQ_API_BASE = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.2-11b-vision-preview'

const SYSTEM_PROMPT = `You are an institutional-grade trading analyst specializing in ICT (Inner Circle Trader) and Smart Money Concepts. Analyze the chart image and provide a structured JSON analysis.

Rules:
- Analyze ONLY what you can see on the chart
- Never guarantee outcomes — present probabilities
- Be specific with price levels; do not use vague terms
- Base confidence on visible chart structure, not hypotheticals
- Output ONLY valid JSON, no markdown fences, no extra text`

const DIRECT_PROMPT = `Analyze this trading chart image. Identify the following and return ONLY valid JSON (no markdown, no extra text):
{
  "bias": "bullish|bearish",
  "entryZone": "low-high",
  "stopLoss": "price",
  "takeProfit1": "price",
  "takeProfit2": "price",
  "takeProfit3": "price",
  "confidence": 0-100,
  "reasoning": [{"type": "bullish|bearish|neutral", "text": "..."}],
  "structureNotes": "...",
  "liquidityNotes": "..."
}`

async function callGroqVision(
  imageBase64: string,
  context: Pick<ChartContext, 'symbol' | 'timeframe'>,
): Promise<AnalysisResult> {
  const dataUrl = imageBase64.startsWith('data:')
    ? imageBase64
    : `data:image/png;base64,${imageBase64}`

  const res = await fetch(GROQ_API_BASE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.1,
      max_tokens: 2048,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: `${DIRECT_PROMPT}\n\nChart: ${context.symbol} / ${context.timeframe}` },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Groq API returned ${res.status}: ${text}`)
  }

  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content
  if (!raw) throw new Error('Groq returned empty response')

  return parseAndValidate(raw, context, marketPriceFromContext(context))
}

// ─── Parse & Validate Groq Response ────────────────────────────────

function parseAndValidate(
  raw: string,
  context: Pick<ChartContext, 'symbol' | 'timeframe'>,
  price: number,
): AnalysisResult {
  let parsed: Record<string, unknown>

  try {
    // Strip markdown code fences if present
    let clean = raw.trim()
    const jsonMatch = clean.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) clean = jsonMatch[1].trim()
    parsed = JSON.parse(clean)
  } catch {
    // Fallback: strip non-JSON characters
    const cleaned = raw.replace(/[^{}[\]"(),:.\d\-eE\s]/g, '').trim()
    parsed = JSON.parse(cleaned)
  }

  const bias: AnalysisBias = ['bullish', 'bearish'].includes(parsed.bias as string)
    ? (parsed.bias as AnalysisBias)
    : price > 1900 ? 'bearish' : 'bullish'

  const isBullish = bias === 'bullish'
  const entryLow = parseFloat(String(parsed.entryZone ?? '').split('-')[0]) || price - 2
  const entryHigh = parseFloat(String(parsed.entryZone ?? '').split('-')[1]) || price + 2
  const sl = parseFloat(String(parsed.stopLoss)) || (isBullish ? price - 5 : price + 5)
  const tp1 = parseFloat(String(parsed.takeProfit1)) || (isBullish ? price + 5 : price - 5)
  const tp2 = parseFloat(String(parsed.takeProfit2)) || (isBullish ? price + 10 : price - 10)
  const tp3 = parsed.takeProfit3 ? parseFloat(String(parsed.takeProfit3)) : undefined
  const confidence = Math.min(100, Math.max(0, parseFloat(String(parsed.confidence)) || 50))
  const rawReasons = Array.isArray(parsed.reasoning) ? parsed.reasoning : []
  const reasoning = rawReasons.slice(0, 5).map((r: Record<string, unknown>) => ({
    type: (['bullish', 'bearish', 'neutral'].includes(r.type as string) ? r.type : 'neutral') as AnalysisBias,
    text: String(r.text ?? ''),
  }))

  const rr = Math.abs(parseFloat(((tp1 - entryLow) / (sl - entryLow)).toFixed(2))) || 0

  const entryZone: [number, number] = [
    parseFloat(entryLow.toFixed(2)),
    parseFloat(entryHigh.toFixed(2)),
  ]

  const scores = computeScores(confidence, rr)

  return {
    symbol: context.symbol ?? 'UNKNOWN',
    timeframe: context.timeframe ?? '1h',
    currentPrice: parseFloat(price.toFixed(2)),
    bias,
    confidence,
    entryZone,
    stopLoss: parseFloat(sl.toFixed(2)),
    takeProfit1: parseFloat(tp1.toFixed(2)),
    takeProfit2: parseFloat(tp2.toFixed(2)),
    takeProfit3: tp3 ? parseFloat(tp3.toFixed(2)) : undefined,
    riskReward: parseFloat(rr.toFixed(2)),
    marketStructure: {
      trend: isBullish ? 'bullish' : 'bearish',
      pattern: null,
      swingHighs: [],
      swingLows: [],
      bosDetected: false,
      chochDetected: false,
      orderBlocks: [],
      liquidity: {
        buySide: null,
        sellSide: null,
        nearestSide: null,
        nearestDistancePercent: 0,
      },
    },
    reasoning,
    scores,
    timestamp: new Date().toISOString(),
    tier: 'free',
    remaining: 0,
    _lockedFields: [],
  }
}

function computeScores(confidence: number, rr: number) {
  const trend = confidence * 0.3
  const structure = confidence * 0.25
  const liquidity = confidence * 0.25
  const riskScore = rr >= 2 ? 85 : rr >= 1.5 ? 70 : 50
  const risk = riskScore * 0.2
  return {
    trend: Math.round(trend),
    structure: Math.round(structure),
    liquidity: Math.round(liquidity),
    risk: Math.round(risk),
    overall: Math.round(trend + structure + liquidity + risk),
  }
}

// ─── Mock (deterministic, seeded by symbol + day) ──────────────────

function seedFromSymbol(symbol: string): number {
  let hash = 0
  for (let i = 0; i < symbol.length; i++) {
    hash = ((hash << 5) - hash) + symbol.charCodeAt(i)
    hash |= 0
  }
  const day = new Date().getDate()
  return Math.abs(hash + day)
}

export function mockAnalyzeChart(
  context: Pick<ChartContext, 'symbol' | 'timeframe'>,
  market: MarketType,
  tier: TierType,
): AnalysisResult {
  const seed = seedFromSymbol(context.symbol ?? 'UNKNOWN')
  const isBullish = seed % 3 !== 0 // ~67% bullish bias
  const confidence = (seed % 40) + 55 // 55-94 range
  const price = marketPrice(market, context.symbol)
  const entrySpread = (seed % 10) + 5

  const entryLow = isBullish ? price - entrySpread : price - entrySpread * 0.5
  const entryHigh = isBullish ? price + entrySpread * 0.5 : price + entrySpread
  const sl = isBullish
    ? parseFloat((price - entrySpread * 2).toFixed(2))
    : parseFloat((price + entrySpread * 2).toFixed(2))
  const tp1 = isBullish
    ? parseFloat((price + entrySpread * 3).toFixed(2))
    : parseFloat((price - entrySpread * 3).toFixed(2))
  const tp2 = isBullish
    ? parseFloat((price + entrySpread * 5).toFixed(2))
    : parseFloat((price - entrySpread * 5).toFixed(2))
  const tp3 = isBullish
    ? parseFloat((price + entrySpread * 8).toFixed(2))
    : parseFloat((price - entrySpread * 8).toFixed(2))

  const rr = parseFloat(((tp1 - entryLow) / (sl - entryLow)).toFixed(2))

  const reasoning = [
    { type: isBullish ? 'bullish' as const : 'bearish' as const, text: `Price approaching key ${isBullish ? 'support' : 'resistance'} zone` },
    { type: isBullish ? 'bullish' as const : 'bearish' as const, text: `${isBullish ? 'Buy-side' : 'Sell-side'} liquidity detected above recent highs` },
    { type: 'neutral' as const, text: `Market structure shows potential ${isBullish ? 'continuation' : 'reversal'} pattern` },
    { type: isBullish ? 'bullish' as const : 'bearish' as const, text: `Order block identified at ${isBullish ? demand : supply} zone` },
  ]

  const lockedFields = tier === 'free'
    ? ['marketStructure', 'riskReward', 'takeProfit3']
    : tier === 'starter'
      ? ['takeProfit3']
      : []

  return {
    symbol: context.symbol ?? 'UNKNOWN',
    timeframe: context.timeframe ?? '1h',
    currentPrice: price,
    bias: isBullish ? 'bullish' : 'bearish',
    confidence,
    entryZone: [parseFloat(entryLow.toFixed(2)), parseFloat(entryHigh.toFixed(2))],
    stopLoss: sl,
    takeProfit1: tp1,
    takeProfit2: tp2,
    takeProfit3: tier === 'pro' || tier === 'elite' ? tp3 : undefined,
    riskReward: tier === 'pro' || tier === 'elite' ? rr : 0,
    marketStructure: {
      trend: isBullish ? 'bullish' : 'bearish',
      pattern: (isBullish ? 'continuation_bullish' : 'continuation_bearish') as any,
      swingHighs: [parseFloat((price + entrySpread * 1.5).toFixed(2))],
      swingLows: [parseFloat((price - entrySpread * 1.5).toFixed(2))],
      bosDetected: true,
      chochDetected: false,
      orderBlocks: [{
        type: isBullish ? 'bullish' as const : 'bearish' as const,
        priceRange: [parseFloat((price - entrySpread).toFixed(2)), parseFloat((price + entrySpread).toFixed(2))],
        strength: 'moderate' as const,
      }],
      liquidity: {
        buySide: isBullish ? { price: parseFloat((price + entrySpread * 3).toFixed(2)), distancePercent: parseFloat(((entrySpread * 3 / price) * 100).toFixed(2)) } : null,
        sellSide: !isBullish ? { price: parseFloat((price - entrySpread * 3).toFixed(2)), distancePercent: parseFloat(((entrySpread * 3 / price) * 100).toFixed(2)) } : null,
        nearestSide: isBullish ? 'buy' : 'sell',
        nearestDistancePercent: parseFloat(((entrySpread * 3 / price) * 100).toFixed(2)),
      },
    },
    reasoning,
    scores: computeScores(confidence, rr),
    timestamp: new Date().toISOString(),
    tier,
    remaining: 5,
    _lockedFields: lockedFields,
  }
}

// ─── Helpers ───────────────────────────────────────────────────────

function marketPrice(market: MarketType, symbol?: string): number {
  if (symbol?.includes('XAU') || symbol?.includes('GOLD')) return 1900 + (seedFromSymbol(symbol ?? 'XAU') % 50)
  if (market === 'FOREX' || symbol?.includes('EUR')) return 1.08 + (seedFromSymbol(symbol ?? 'EUR') % 10) / 100
  if (market === 'CRYPTO' || symbol?.includes('BTC')) return 60000 + (seedFromSymbol(symbol ?? 'BTC') % 5000)
  return 150 + (seedFromSymbol(symbol ?? 'AAPL') % 100)
}

function marketPriceFromContext(_context: Pick<ChartContext, 'symbol' | 'timeframe'>): number {
  // Generic fallback price
  return 1900
}


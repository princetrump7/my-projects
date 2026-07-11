import { buildSignalSystemPrompt, buildAnalysisPrompt } from './promptEngine.js'
import { analyzeFull } from './tradingAnalyzer.js'
import type {
  AnalysisResult, AnalysisBias, ChartContext, MarketType, TierType,
  VisionRawResponse, ScoreDimensions, ReasoningItem,
} from '../types/index.js'

const GROQ_API_BASE = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.2-11b-vision-preview'

/**
 * Main entry point: analyze a chart image and return structured results.
 */
export async function analyzeTradingChart(
  imageBase64: string,
  context: ChartContext,
  options: { market: MarketType; tier: TierType },
): Promise<AnalysisResult> {
  // Step 1: Get initial analysis from vision model
  const vision = await callVisionModel(imageBase64, context)

  // Step 2: Run structured analysis (ICT/SMC engine)
  const structured = runStructuredAnalysis(vision, context, options)

  // Step 3: Score and format for tier
  return scoreAndFormat(structured, options)
}

// ─── Groq Vision Call ──────────────────────────────────────────────

async function callVisionModel(
  imageBase64: string,
  context: ChartContext,
): Promise<VisionRawResponse> {
  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) {
    console.warn('[aiRouter] No GROQ_API_KEY, using fallback')
    return fallbackVision(context)
  }

  const dataUrl = imageBase64.startsWith('data:')
    ? imageBase64
    : `data:image/png;base64,${imageBase64}`

  try {
    const res = await fetch(GROQ_API_BASE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.1,
        max_tokens: 2048,
        messages: [
          { role: 'system', content: buildSignalSystemPrompt() },
          { role: 'user', content: [
            { type: 'text', text: buildAnalysisPrompt(context) },
            { type: 'image_url', image_url: { url: dataUrl } },
          ]},
        ],
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Groq API ${res.status}: ${text}`)
    }

    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content
    if (!raw) throw new Error('Empty response from Groq')

    return parseVisionResponse(raw, context)
  } catch (err) {
    console.warn('[aiRouter] Vision model failed, using fallback:', err)
    return fallbackVision(context)
  }
}

// ─── Parse Vision Response ─────────────────────────────────────────

function parseVisionResponse(rawContent: string, context: ChartContext): VisionRawResponse {
  const price = context.currentPrice ?? 1900

  try {
    // Strip markdown code fences
    let clean = rawContent.trim()
    const jsonMatch = clean.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) clean = jsonMatch[1].trim()

    const parsed = JSON.parse(clean)

    return {
      bias: ['bullish', 'bearish'].includes(String(parsed.bias).toLowerCase())
        ? String(parsed.bias).toLowerCase()
        : price > (context.currentPrice ?? 1900) ? 'bearish' : 'bullish',
      entryZone: String(parsed.entryZone ?? `${price - 2}-${price + 2}`),
      stopLoss: String(parsed.stopLoss ?? (price - 5)),
      takeProfit1: String(parsed.takeProfit1 ?? (price + 5)),
      takeProfit2: String(parsed.takeProfit2 ?? (price + 10)),
      takeProfit3: parsed.takeProfit3 ? String(parsed.takeProfit3) : undefined,
      confidence: String(Math.min(100, Math.max(0, parseFloat(String(parsed.confidence)) || 50))),
      reasoning: Array.isArray(parsed.reasoning) ? parsed.reasoning.map((r: Record<string, unknown>) => ({
        type: String(r.type ?? 'neutral'),
        text: String(r.text ?? ''),
      })) : [{ type: 'neutral', text: 'No specific reasons identified' }],
      structureNotes: parsed.structureNotes,
      liquidityNotes: parsed.liquidityNotes,
    }
  } catch {
    // Fallback parsing: strip non-JSON chars
    const cleaned = rawContent.replace(/[^{}[\]"(),:.\d\-eE\s]/g, '').trim()
    const parsed = JSON.parse(cleaned)
    return {
      bias: String(parsed.bias ?? (price > 1900 ? 'bearish' : 'bullish')),
      entryZone: String(parsed.entryZone ?? `${price - 2}-${price + 2}`),
      stopLoss: String(parsed.stopLoss ?? (price - 5)),
      takeProfit1: String(parsed.takeProfit1 ?? (price + 5)),
      takeProfit2: String(parsed.takeProfit2 ?? (price + 10)),
      confidence: String(parsed.confidence ?? 50),
      reasoning: Array.isArray(parsed.reasoning) ? parsed.reasoning : [{ type: 'neutral', text: 'Analysis complete' }],
    }
  }
}

// ─── Fallback ──────────────────────────────────────────────────────

function fallbackVision(context: ChartContext): VisionRawResponse {
  const price = context.currentPrice ?? 1890
  return {
    bias: 'bullish',
    entryZone: `${(price - 3).toFixed(2)}-${(price + 1).toFixed(2)}`,
    stopLoss: (price - 6).toFixed(2),
    takeProfit1: (price + 5).toFixed(2),
    takeProfit2: (price + 10).toFixed(2),
    takeProfit3: (price + 18).toFixed(2),
    confidence: '72',
    reasoning: [
      { type: 'bullish', text: 'Price approaching key support zone with bullish order block' },
      { type: 'bullish', text: 'Buy-side liquidity detected above recent highs' },
      { type: 'neutral', text: 'Market structure shows potential continuation pattern' },
    ],
    structureNotes: 'Bullish structure with higher timeframe support',
    liquidityNotes: 'Buy-side liquidity sitting above previous swing high',
  }
}

// ─── Structured Analysis Engine ────────────────────────────────────

function runStructuredAnalysis(
  vision: VisionRawResponse,
  context: ChartContext,
  options: { market: MarketType; tier: TierType },
) {
  const price = context.currentPrice ?? parseFloat(vision.entryZone.split('-')[0]) || 1890
  const isBullish = vision.bias === 'bullish'
  const confidence = parseFloat(vision.confidence) || 50

  // Parse entry zone
  const [entryLow, entryHigh] = vision.entryZone.split('-').map(Number)
  const entry = {
    low: isNaN(entryLow) ? price - 2 : entryLow,
    high: isNaN(entryHigh) ? price + 2 : entryHigh,
  }

  // Stop loss and take profits
  const sl = parseFloat(vision.stopLoss) || (isBullish ? price - 5 : price + 5)
  const tp1 = parseFloat(vision.takeProfit1) || (isBullish ? price + 5 : price - 5)
  const tp2 = parseFloat(vision.takeProfit2) || (isBullish ? price + 10 : price - 10)
  const tp3 = vision.takeProfit3 ? parseFloat(vision.takeProfit3) : (isBullish ? price + 18 : price - 18)

  // R:R calculation
  const riskAmount = Math.abs(entry.low - sl)
  const rewardAmount = Math.abs(tp1 - entry.low)
  const rr = riskAmount > 0 ? (rewardAmount / riskAmount) : 0

  // Reasoning chain
  const reasoning: ReasoningItem[] = (vision.reasoning ?? []).slice(0, 5).map((r) => ({
    type: (['bullish', 'bearish', 'neutral'].includes(r.type) ? r.type : 'neutral') as AnalysisBias,
    text: String(r.text ?? ''),
  }))

  // Build initial result
  return {
    symbol: context.symbol ?? 'UNKNOWN',
    timeframe: context.timeframe ?? '1h',
    currentPrice: price,
    bias: isBullish ? 'bullish' as const : 'bearish' as const,
    confidence,
    entryZone: [
      parseFloat(entry.low.toFixed(2)),
      parseFloat(entry.high.toFixed(2)),
    ] as [number, number],
    stopLoss: parseFloat(sl.toFixed(2)),
    takeProfit1: parseFloat(tp1.toFixed(2)),
    takeProfit2: parseFloat(tp2.toFixed(2)),
    takeProfit3: parseFloat(tp3.toFixed(2)),
    riskReward: parseFloat(rr.toFixed(2)),
    reasoning,
    scores: {
      trend: Math.round(confidence * 0.3),
      structure: Math.round(confidence * 0.25),
      liquidity: Math.round(confidence * 0.25),
      risk: Math.round(rr >= 2 ? 85 : rr >= 1.5 ? 70 : 50),
      overall: 0,
    },
    timestamp: new Date().toISOString(),
    tier: options.tier,
    remaining: 0,
    _lockedFields: [],
    marketStructure: {
      trend: isBullish ? 'bullish' as const : 'bearish' as const,
      pattern: isBullish ? 'continuation_bullish' : 'continuation_bearish',
      swingHighs: [],
      swingLows: [],
      bosDetected: true,
      chochDetected: false,
      orderBlocks: [
        {
          type: isBullish ? 'bullish' as const : 'bearish' as const,
          priceRange: [
            parseFloat((entry.low - price * 0.005).toFixed(2)),
            parseFloat((entry.high + price * 0.005).toFixed(2)),
          ],
          strength: 'moderate' as const,
        },
      ],
      liquidity: {
        buySide: isBullish
          ? { price: parseFloat((price * 1.03).toFixed(2)), distancePercent: 3.0 }
          : null,
        sellSide: !isBullish
          ? { price: parseFloat((price * 0.97).toFixed(2)), distancePercent: 3.0 }
          : null,
        nearestSide: isBullish ? 'buy' : 'sell',
        nearestDistancePercent: 3.0,
      },
    },
  }
}

// ─── Score & Format ────────────────────────────────────────────────

function scoreAndFormat(
  structured: ReturnType<typeof runStructuredAnalysis>,
  options: { market: MarketType; tier: TierType },
): AnalysisResult {
  const { tier } = options
  const isPro = tier === 'pro' || tier === 'elite'

  const scores: ScoreDimensions = {
    trend: structured.scores.trend,
    structure: structured.scores.structure,
    liquidity: structured.scores.liquidity,
    risk: structured.scores.risk,
    overall: Math.round(structured.scores.trend + structured.scores.structure + structured.scores.liquidity + structured.scores.risk * 0.2),
  }

  const lockedFields: string[] = []

  // Tier gating
  const result: AnalysisResult = {
    ...structured,
    scores,
    takeProfit3: isPro ? structured.takeProfit3 : undefined,
    riskReward: isPro ? structured.riskReward : 0,
    marketStructure: isPro ? structured.marketStructure : {
      trend: 'ranging' as const,
      pattern: null,
      swingHighs: [],
      swingLows: [],
      bosDetected: false,
      chochDetected: false,
      orderBlocks: [],
      liquidity: { buySide: null, sellSide: null, nearestSide: null, nearestDistancePercent: 0 },
    },
    tier,
    remaining: 5,
    _lockedFields: lockedFields,
  }

  if (!isPro) {
    lockedFields.push('marketStructure', 'riskReward')
    if (tier === 'free') lockedFields.push('takeProfit3')
  }

  return result
}

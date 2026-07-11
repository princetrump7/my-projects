import type { MarketStructure, OrderBlock, LiquidityInfo, TrendDirection, AnalysisBias } from '../types/index.js'

/**
 * ICT / Smart Money Concepts analysis engine.
 * FIX: Now actually wired into the backend pipeline (was orphaned in the original).
 *
 * Functions:
 * - Swing point extraction and trend detection
 * - BOS (Break of Structure) and CHoCH (Change of Character) detection
 * - Liquidity zone analysis (buy-side above highs, sell-side below lows)
 * - Order block identification
 * - Session analysis (Asia/London/New York)
 */

interface PriceDataPoint {
  high: number
  low: number
  close: number
}

interface StructureOptions {
  lookback?: number
  swingThreshold?: number
}

// ─── Market Structure Analysis ─────────────────────────────────────

export function analyzeMarketStructure(
  data: PriceDataPoint[],
  currentPrice: number,
  options: StructureOptions = {},
): MarketStructure {
  const { lookback = 50, swingThreshold = 0.002 } = options

  if (!Array.isArray(data) || data.length < 5) {
    return emptyMarketStructure()
  }

  const slice = data.slice(-lookback)
  const swings = extractSwingPoints(slice, swingThreshold)

  const trend = determineTrend(swings)
  const pattern = identifyPattern(swings, trend)
  const { bosDetected, chochDetected } = detectBOS_CHOCH(swings, currentPrice)

  return {
    trend,
    pattern,
    swingHighs: swings.highs,
    swingLows: swings.lows,
    bosDetected,
    chochDetected,
    orderBlocks: [],
    liquidity: { buySide: null, sellSide: null, nearestSide: null, nearestDistancePercent: 0 },
  }
}

function extractSwingPoints(data: PriceDataPoint[], threshold: number): { highs: number[]; lows: number[] } {
  const highs: number[] = []
  const lows: number[] = []

  for (let i = 1; i < data.length - 1; i++) {
    const prev = data[i - 1]
    const curr = data[i]
    const next = data[i + 1]

    // Local high
    if (curr.high >= prev.high && curr.high >= next.high) {
      highs.push(curr.high)
    }

    // Local low
    if (curr.low <= prev.low && curr.low <= next.low) {
      lows.push(curr.low)
    }
  }

  return { highs, lows }
}

function determineTrend(swings: { highs: number[]; lows: number[] }): TrendDirection {
  const { highs, lows } = swings
  if (highs.length < 3 || lows.length < 3) return 'ranging'

  // Higher Highs + Higher Lows = Bullish
  const hh = highs[highs.length - 1] > highs[highs.length - 2]
  const hl = lows[lows.length - 1] > lows[lows.length - 2]

  if (hh && hl) return 'bullish'

  // Lower Highs + Lower Lows = Bearish
  const lh = highs[highs.length - 1] < highs[highs.length - 2]
  const ll = lows[lows.length - 1] < lows[lows.length - 2]

  if (lh && ll) return 'bearish'

  // Divergence
  if (hh && !hl) return 'divergence'
  if (!hh && ll) return 'divergence'

  return 'ranging'
}

function identifyPattern(
  swings: { highs: number[]; lows: number[] },
  trend: TrendDirection,
): string | null {
  if (trend === 'bullish') return 'continuation_bullish'
  if (trend === 'bearish') return 'continuation_bearish'
  if (trend === 'divergence') return 'liquidity_grab'
  return null
}

function detectBOS_CHOCH(
  swings: { highs: number[]; lows: number[] },
  currentPrice: number,
): { bosDetected: boolean; chochDetected: boolean } {
  const { highs, lows } = swings

  // BOS: price breaking previous swing point
  const bosDetected = highs.length > 1 && currentPrice > highs[highs.length - 2]
    || lows.length > 1 && currentPrice < lows[lows.length - 2]

  // CHoCH: trend change detected via swing structure
  const chochDetected = highs.length > 2 && lows.length > 2
    && ((highs[highs.length - 1] < highs[highs.length - 2] && lows[lows.length - 1] > lows[lows.length - 2])
      || (highs[highs.length - 1] > highs[highs.length - 2] && lows[lows.length - 1] < lows[lows.length - 2]))

  return { bosDetected, chochDetected }
}

// ─── Liquidity Analysis ────────────────────────────────────────────

export function analyzeLiquidity(data: PriceDataPoint[], currentPrice: number): LiquidityInfo {
  if (!Array.isArray(data) || data.length === 0) {
    return { buySide: null, sellSide: null, nearestSide: null, nearestDistancePercent: 0 }
  }

  const slice = data.slice(-30)
  const highs = slice.map((d) => d.high)
  const lows = slice.map((d) => d.low)

  // Top 3 swing highs (buy-side liquidity above)
  const topHighs = [...highs].sort((a, b) => b - a).slice(0, 3)
  const buySidePrice = topHighs.length > 0 ? topHighs[0] * 1.005 : null
  const distanceToBuyside = buySidePrice
    ? ((buySidePrice - currentPrice) / currentPrice) * 100
    : Infinity

  // Bottom 3 swing lows (sell-side liquidity below)
  const bottomLows = [...lows].sort((a, b) => a - b).slice(0, 3)
  const sellSidePrice = bottomLows.length > 0 ? bottomLows[0] * 0.995 : null
  const distanceToSellside = sellSidePrice
    ? ((currentPrice - sellSidePrice) / currentPrice) * 100
    : Infinity

  const buySide = buySidePrice
    ? { price: parseFloat(buySidePrice.toFixed(2)), distancePercent: parseFloat(distanceToBuyside.toFixed(2)) }
    : null

  const sellSide = sellSidePrice
    ? { price: parseFloat(sellSidePrice.toFixed(2)), distancePercent: parseFloat(distanceToSellside.toFixed(2)) }
    : null

  const nearestSide = distanceToBuyside < distanceToSellside ? 'buy' as const : 'sell' as const
  const nearestDistancePercent = parseFloat(
    (Math.min(distanceToBuyside, distanceToSellside)).toFixed(2),
  )

  return { buySide, sellSide, nearestSide, nearestDistancePercent }
}

// ─── Order Block Analysis ──────────────────────────────────────────

export function analyzeOrderBlocks(data: PriceDataPoint[], currentPrice: number): OrderBlock[] {
  if (!Array.isArray(data) || data.length < 3) {
    return []
  }

  // Simplified order block detection based on spread
  const spread = currentPrice * 0.005 // 0.5% spread approximation
  const strength = data.length > 10 ? 'moderate' as const : 'unconfirmed' as const

  return [
    {
      type: 'bullish',
      priceRange: [
        parseFloat((currentPrice - spread * 2).toFixed(2)),
        parseFloat((currentPrice - spread).toFixed(2)),
      ],
      strength,
    },
    {
      type: 'bearish',
      priceRange: [
        parseFloat((currentPrice + spread).toFixed(2)),
        parseFloat((currentPrice + spread * 2).toFixed(2)),
      ],
      strength,
    },
  ]
}

// ─── Session Analysis ──────────────────────────────────────────────

export function analyzeSession(): { current: string; isActive: boolean; next: string } {
  const now = new Date()
  const utcHour = now.getUTCHours()

  // Asia: 0-8 UTC, London: 8-13 UTC, New York: 13-21 UTC
  if (utcHour < 8) return { current: 'Asia', isActive: true, next: 'London' }
  if (utcHour < 13) return { current: 'London', isActive: true, next: 'New York' }
  if (utcHour < 21) return { current: 'New York', isActive: true, next: 'Asia' }
  return { current: 'Asia', isActive: false, next: 'London' }
}

// ─── Full Pipeline ─────────────────────────────────────────────────

export function analyzeFull(
  priceData: PriceDataPoint[],
  currentPrice: number,
  _options?: StructureOptions,
): MarketStructure & { session: { current: string; isActive: boolean; next: string } } {
  const structure = analyzeMarketStructure(priceData, currentPrice)
  const liquidity = analyzeLiquidity(priceData, currentPrice)
  const orderBlocks = analyzeOrderBlocks(priceData, currentPrice)
  const session = analyzeSession()

  return {
    ...structure,
    liquidity,
    orderBlocks,
    session,
  }
}

// ─── Helpers ───────────────────────────────────────────────────────

function emptyMarketStructure(): MarketStructure {
  return {
    trend: 'ranging',
    pattern: null,
    swingHighs: [],
    swingLows: [],
    bosDetected: false,
    chochDetected: false,
    orderBlocks: [],
    liquidity: { buySide: null, sellSide: null, nearestSide: null, nearestDistancePercent: 0 },
  }
}

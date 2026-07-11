// ─── Shared Types ──────────────────────────────────────────────────

export type AnalysisBias = 'bullish' | 'bearish' | 'neutral'
export type TrendDirection = 'bullish' | 'bearish' | 'divergence' | 'ranging'
export type TierType = 'free' | 'starter' | 'pro' | 'elite'
export type MarketType = 'XAUUSD' | 'FOREX' | 'CRYPTO' | 'STOCKS'

export interface ChartContext {
  symbol: string
  timeframe: string
  currentPrice: number | null
  market: MarketType | null
}

export interface VisionRawResponse {
  bias: string
  entryZone: string
  stopLoss: string
  takeProfit1: string
  takeProfit2: string
  takeProfit3?: string
  confidence: string
  reasoning: { type: string; text: string }[]
  structureNotes?: string
  liquidityNotes?: string
}

export interface ScoreDimensions {
  trend: number
  structure: number
  liquidity: number
  risk: number
  overall: number
}

export interface AnalysisResult {
  symbol: string
  timeframe: string
  currentPrice: number
  bias: AnalysisBias
  confidence: number
  entryZone: [number, number]
  stopLoss: number
  takeProfit1: number
  takeProfit2: number
  takeProfit3?: number
  riskReward: number
  marketStructure: MarketStructure
  reasoning: ReasoningItem[]
  scores: ScoreDimensions
  timestamp: string
  tier: TierType
  remaining: number
  _lockedFields: string[]
}

export interface ReasoningItem {
  type: AnalysisBias
  text: string
}

export interface MarketStructure {
  trend: TrendDirection
  pattern: string | null
  swingHighs: number[]
  swingLows: number[]
  bosDetected: boolean
  chochDetected: boolean
  orderBlocks: OrderBlock[]
  liquidity: LiquidityInfo
}

export interface OrderBlock {
  type: 'bullish' | 'bearish'
  priceRange: [number, number]
  strength: 'strong' | 'moderate' | 'unconfirmed'
}

export interface LiquidityInfo {
  buySide: { price: number; distancePercent: number } | null
  sellSide: { price: number; distancePercent: number } | null
  nearestSide: 'buy' | 'sell' | null
  nearestDistancePercent: number
}

export interface AnalyzeRequestBody {
  image: string
  context: ChartContext
  market: MarketType
  tier: TierType
  userId: string
  timestamp?: string
}

// ─── Stripe Types ──────────────────────────────────────────────────

export interface CheckoutSessionRequest {
  tier: TierType
  userId: string
  successUrl: string
  cancelUrl: string
}

export interface CheckoutSessionResponse {
  url: string
  sessionId: string
}

// ─── Pricing ───────────────────────────────────────────────────────

export interface PriceConfig {
  monthly: number
  stripePriceId: string
}

export const PRICES: Record<TierType, PriceConfig> = {
  free: { monthly: 0, stripePriceId: '' },
  starter: { monthly: 15, stripePriceId: '' },
  pro: { monthly: 29, stripePriceId: '' },
  elite: { monthly: 99, stripePriceId: '' },
}

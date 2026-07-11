// ─── Market ─────────────────────────────────────────────────────────
export enum MarketType {
  XAUUSD = 'XAUUSD',
  FOREX = 'FOREX',
  CRYPTO = 'CRYPTO',
  STOCKS = 'STOCKS',
}

export interface MarketDefinition {
  id: MarketType
  label: string
  emoji: string
}

// ─── Tiers & Subscriptions ─────────────────────────────────────────
export enum TierType {
  FREE = 'free',
  STARTER = 'starter',
  PRO = 'pro',
  ELITE = 'elite',
}

export interface TierLimits {
  analysesPerDay?: number
  analysesPerMonth?: number
  features: {
    multiTimeframe: boolean
    highProbFilter: boolean
    liquidityEngine: boolean
    strategyPresets: boolean
    sessionAnalysis: boolean
  }
}

export interface TierPrice {
  monthly: number
  description: string
}

export interface TierDefinition {
  id: TierType
  label: string
  limits: TierLimits
  price: TierPrice
}

// ─── Analysis Types ────────────────────────────────────────────────
export type AnalysisBias = 'bullish' | 'bearish' | 'neutral'

export type TrendDirection = 'bullish' | 'bearish' | 'divergence' | 'ranging'

export type MarketPattern =
  | 'continuation_bullish'
  | 'continuation_bearish'
  | 'liquidity_grab_bullish'
  | 'liquidity_grab_bearish'

export interface MarketStructure {
  trend: TrendDirection
  pattern: MarketPattern | null
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

export interface SessionInfo {
  current: string
  isActive: boolean
  next: string
}

export interface ReasoningItem {
  type: 'bullish' | 'bearish' | 'neutral'
  text: string
}

export interface AnalysisResult {
  // Core
  symbol: string
  timeframe: string
  currentPrice: number
  bias: AnalysisBias
  confidence: number

  // Entry / Exit
  entryZone: [number, number]
  stopLoss: number
  takeProfit1: number
  takeProfit2: number
  takeProfit3?: number // Pro+ only
  riskReward: number // Pro+ only

  // Market analysis
  marketStructure: MarketStructure // Pro+ only
  reasoning: ReasoningItem[]
  scores: ScoreDimensions

  // Metadata
  timestamp: string
  tier: TierType
  remaining: number
  _lockedFields: string[] // UI hints for free tier
}

export interface ScoreDimensions {
  trend: number
  structure: number
  liquidity: number
  risk: number
  overall: number
}

// ─── Chart Context ─────────────────────────────────────────────────
export interface ChartContext {
  symbol: string
  timeframe: string
  currentPrice: number | null
  market: MarketType | null
}

// ─── Onboarding ────────────────────────────────────────────────────
export enum OnboardingStep {
  WELCOME = 'WELCOME',
  MARKET_SELECT = 'MARKET_SELECT',
  CHART_DETECT = 'CHART_DETECT',
  FIRST_RESULT = 'FIRST_RESULT',
  VALUE_DEEPEN = 'VALUE_DEEPEN',
  SECOND_LOOP = 'SECOND_LOOP',
  SOFT_PAYWALL = 'SOFT_PAYWALL',
  PRICING = 'PRICING',
}

export const ONBOARDING_STEPS = [
  OnboardingStep.WELCOME,
  OnboardingStep.MARKET_SELECT,
  OnboardingStep.CHART_DETECT,
  OnboardingStep.FIRST_RESULT,
  OnboardingStep.VALUE_DEEPEN,
  OnboardingStep.SECOND_LOOP,
  OnboardingStep.SOFT_PAYWALL,
  OnboardingStep.PRICING,
] as const

// ─── Vision / API Types ────────────────────────────────────────────
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

export interface AnalyzeRequest {
  image: string // base64 PNG
  context: ChartContext
  market: MarketType
  tier: TierType
  userId: string
}

export interface AnalyzeResponse {
  result: AnalysisResult
  remaining: number
}

// ─── Subscription / Stripe ─────────────────────────────────────────
export interface Subscription {
  tier: TierType
  status: 'active' | 'past_due' | 'canceled' | 'incomplete'
  currentPeriodEnd: string | null
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
}

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

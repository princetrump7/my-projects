import type { AnalysisResult, ChartContext, MarketType, TierType } from './types.js'
import { MSG } from './constants.js'

// ─── Background → Content Messages ─────────────────────────────────

export interface AnalysisResultMessage {
  type: typeof MSG.ANALYSIS_RESULT
  result: AnalysisResult
}

export interface AnalysisErrorMessage {
  type: typeof MSG.ANALYSIS_ERROR
  error: string
}

export interface UsageUpdateMessage {
  type: typeof MSG.USAGE_UPDATE
  remaining: number
  tier: TierType
}

export type BackgroundToContent =
  | AnalysisResultMessage
  | AnalysisErrorMessage
  | UsageUpdateMessage

// ─── Content → Background Messages ─────────────────────────────────

export interface AnalyzeChartMessage {
  type: typeof MSG.ANALYZE_CHART
  context: ChartContext
  image?: string
}

export interface CaptureVisibleTabMessage {
  type: typeof MSG.CAPTURE_VISIBLE_TAB
}

export interface GetStateMessage {
  type: typeof MSG.GET_STATE
}

export interface SetMarketMessage {
  type: typeof MSG.SET_MARKET
  market: MarketType
}

export interface OnboardingCompleteMessage {
  type: typeof MSG.ONBOARDING_COMPLETE
  tier?: TierType
}

export interface SetTierMessage {
  type: typeof MSG.SET_TIER
  tier: TierType
}

export interface SetGroqKeyMessage {
  type: typeof MSG.SET_GROQ_KEY
  key: string
}

export interface SetBackendUrlMessage {
  type: typeof MSG.SET_BACKEND_URL
  url: string
}

export interface GetConfigMessage {
  type: typeof MSG.GET_CONFIG
}

export type ContentToBackground =
  | AnalyzeChartMessage
  | CaptureVisibleTabMessage
  | GetStateMessage
  | SetMarketMessage
  | OnboardingCompleteMessage
  | SetTierMessage
  | SetGroqKeyMessage
  | SetBackendUrlMessage
  | GetConfigMessage

export type ExtensionMessage = ContentToBackground | BackgroundToContent

// ─── Response Types ────────────────────────────────────────────────

export interface StateResponse {
  onboardingComplete: boolean
  selectedMarket: MarketType | null
  subTier: TierType
  usageRemaining: number
}

export interface ConfigResponse {
  baseUrl: string | null
  groqApiKey: string | null
  useMock: boolean
}

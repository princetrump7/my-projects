import { MarketType, OnboardingStep, TierType } from './types.js'
import type { MarketDefinition, TierDefinition } from './types.js'

// ─── Storage Keys ──────────────────────────────────────────────────
export const STORAGE = {
  ONBOARDING_DONE: 'tv_ai_onboarding_done',
  SELECTED_MARKET: 'tv_ai_selected_market',
  USAGE_COUNT: 'tv_ai_usage_count',
  USAGE_DATE: 'tv_ai_usage_date',
  SUB_TIER: 'tv_ai_sub_tier',
  SUB_EXPIRY: 'tv_ai_sub_expiry',
  USER_ID: 'tv_ai_user_id',
  MONTH_KEY: 'tv_ai_month_key',
  MONTHLY_USAGE: 'tv_ai_monthly_usage',
  GROQ_API_KEY: 'tv_ai_groq_api_key',
  BACKEND_URL: 'tv_ai_backend_url',
} as const

// ─── Message Types ─────────────────────────────────────────────────
export const MSG = {
  ANALYZE_CHART: 'ANALYZE_CHART',
  CAPTURE_VISIBLE_TAB: 'CAPTURE_VISIBLE_TAB',
  ANALYSIS_RESULT: 'ANALYSIS_RESULT',
  ANALYSIS_ERROR: 'ANALYSIS_ERROR',
  GET_STATE: 'GET_STATE',
  SET_MARKET: 'SET_MARKET',
  ONBOARDING_COMPLETE: 'ONBOARDING_COMPLETE',
  USAGE_UPDATE: 'USAGE_UPDATE',
  SET_TIER: 'SET_TIER',
  SET_GROQ_KEY: 'SET_GROQ_KEY',
  SET_BACKEND_URL: 'SET_BACKEND_URL',
  GET_CONFIG: 'GET_CONFIG',
} as const

// ─── Tiers ─────────────────────────────────────────────────────────
export const TIER_LIMITS: Record<TierType, TierDefinition['limits']> = {
  [TierType.FREE]: {
    analysesPerDay: 5,
    features: {
      multiTimeframe: false,
      highProbFilter: false,
      liquidityEngine: false,
      strategyPresets: false,
      sessionAnalysis: false,
    },
  },
  [TierType.STARTER]: {
    analysesPerMonth: 100,
    features: {
      multiTimeframe: false,
      highProbFilter: false,
      liquidityEngine: false,
      strategyPresets: false,
      sessionAnalysis: false,
    },
  },
  [TierType.PRO]: {
    analysesPerMonth: Infinity,
    features: {
      multiTimeframe: true,
      highProbFilter: true,
      liquidityEngine: true,
      strategyPresets: false,
      sessionAnalysis: false,
    },
  },
  [TierType.ELITE]: {
    analysesPerMonth: Infinity,
    features: {
      multiTimeframe: true,
      highProbFilter: true,
      liquidityEngine: true,
      strategyPresets: true,
      sessionAnalysis: true,
    },
  },
}

export const TIER_PRICES: Record<TierType, TierDefinition['price']> = {
  [TierType.FREE]: { monthly: 0, description: 'Basic analysis' },
  [TierType.STARTER]: { monthly: 15, description: 'Daily trading edge' },
  [TierType.PRO]: { monthly: 29, description: 'Full institutional toolkit' },
  [TierType.ELITE]: { monthly: 99, description: 'Enterprise-grade insights' },
}

export const TIER_LABELS: Record<TierType, string> = {
  [TierType.FREE]: 'Free',
  [TierType.STARTER]: 'Starter',
  [TierType.PRO]: 'Pro',
  [TierType.ELITE]: 'Elite',
}

// ─── Markets ───────────────────────────────────────────────────────
export const MARKETS: MarketDefinition[] = [
  { id: MarketType.XAUUSD, label: 'XAUUSD (Gold)', emoji: '🥇' },
  { id: MarketType.FOREX, label: 'Forex', emoji: '💱' },
  { id: MarketType.CRYPTO, label: 'Crypto', emoji: '₿' },
  { id: MarketType.STOCKS, label: 'Stocks', emoji: '📈' },
]

// ─── UI Constants ──────────────────────────────────────────────────
export const UI = {
  PANEL_WIDTH: 380,
  Z_INDEX: 99999,
  ANIMATION_DURATION: 300,
  ONBOARDING_DELAY: 3000,
} as const

// ─── Mock Configuration ────────────────────────────────────────────
export const MOCK = {
  USE_MOCK: false as boolean, // override in apiClient for testing
}

// ─── Analysis Constants ────────────────────────────────────────────
export const MAX_FREE_ANALYSES = 5
export const MAX_STARTER_ANALYSES = 100

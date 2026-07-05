// ─── Message Types ───────────────────────────────────────────────
export const MSG = {
  ANALYZE_CHART: "ANALYZE_CHART",
  CAPTURE_VISIBLE_TAB: "CAPTURE_VISIBLE_TAB",
  ANALYSIS_RESULT: "ANALYSIS_RESULT",
  ANALYSIS_ERROR: "ANALYSIS_ERROR",
  SYNC_STATE: "SYNC_STATE",
  GET_STATE: "GET_STATE",
  SET_MARKET: "SET_MARKET",
  GET_MARKET: "GET_MARKET",
  ONBOARDING_COMPLETE: "ONBOARDING_COMPLETE",
  USAGE_UPDATE: "USAGE_UPDATE",
  SET_TIER: "SET_TIER",
};

// ─── Storage Keys ────────────────────────────────────────────────
export const STORAGE = {
  ONBOARDING_DONE: "tv_ai_onboarding_done",
  SELECTED_MARKET: "tv_ai_selected_market",
  USAGE_COUNT: "tv_ai_usage_count",
  USAGE_DATE: "tv_ai_usage_date",
  SUBSCRIPTION_TIER: "tv_ai_sub_tier",
  SUBSCRIPTION_EXPIRY: "tv_ai_sub_expiry",
  USER_ID: "tv_ai_user_id",
};

// ─── Tiers ────────────────────────────────────────────────────────
export const TIER = {
  FREE: "free",
  STARTER: "starter",
  PRO: "pro",
  ELITE: "elite",
};

export const TIER_LIMITS = {
  [TIER.FREE]: { analysesPerDay: 5, multiTimeframe: false, highProbFilter: false, liquidityEngine: false },
  [TIER.STARTER]: { analysesPerMonth: 100, multiTimeframe: false, highProbFilter: false, liquidityEngine: false },
  [TIER.PRO]: { analysesPerMonth: Infinity, multiTimeframe: true, highProbFilter: true, liquidityEngine: true },
  [TIER.ELITE]: { analysesPerMonth: Infinity, multiTimeframe: true, highProbFilter: true, liquidityEngine: true },
};

export const TIER_PRICES = {
  [TIER.STARTER]: 15,
  [TIER.PRO]: 29,
  [TIER.ELITE]: 99,
};

// ─── Markets ──────────────────────────────────────────────────────
export const MARKETS = [
  { id: "xauusd", label: "Gold (XAUUSD)", emoji: "🥇" },
  { id: "forex", label: "Forex Majors", emoji: "💱" },
  { id: "crypto", label: "Crypto", emoji: "₿" },
  { id: "stocks", label: "Stocks", emoji: "📈" },
];

// ─── UI Constants ─────────────────────────────────────────────────
export const UI = {
  PANEL_WIDTH: 380,
  PANEL_Z_INDEX: 99999,
  ANIMATION_DURATION: 300,
  ONBOARDING_DELAY: 3000,
};

// ─── Onboarding Steps ────────────────────────────────────────────
export const ONBOARDING_STEPS = {
  WELCOME: "welcome",
  MARKET_SELECT: "market_select",
  CHART_DETECT: "chart_detect",
  FIRST_ANALYSIS: "first_analysis",
  VALUE_DEEPEN: "value_deepen",
  SECOND_LOOP: "second_loop",
  SOFT_PAYWALL: "soft_paywall",
  PRICING: "pricing",
};

import { create } from 'zustand'
import type { AnalysisResult, MarketType, TierType } from '../../shared/types.js'
import { OnboardingStep, ONBOARDING_STEPS } from '../../shared/types.js'
import { MSG } from '../../shared/constants.js'

// ─── State Shape ───────────────────────────────────────────────────

export interface AppState {
  // Onboarding
  onboardingComplete: boolean
  onboardingStep: OnboardingStep
  selectedMarket: MarketType | null

  // Analysis
  lastAnalysis: AnalysisResult | null
  analyses: AnalysisResult[]
  isAnalyzing: boolean
  lastError: string | null
  analysisErrorType: string | null

  // User
  tier: TierType
  usageRemaining: number
  isUnlimited: boolean

  // UI
  panelOpen: boolean

  // Actions
  setPanelOpen: (open: boolean) => void
  togglePanel: () => void
  selectMarket: (market: MarketType) => void
  nextOnboardingStep: () => void
  skipOnboarding: (tier?: TierType) => Promise<void>
  setTier: (tier: TierType) => void
  triggerAnalysis: (symbol: string, timeframe: string, price: number | null) => Promise<void>
  retryAnalysis: () => Promise<void>
  resetForNewChart: () => void
  setOnboardingStep: (step: OnboardingStep) => void
}

// ─── Chrome Storage Sync ───────────────────────────────────────────

async function loadPersistedState(): Promise<Partial<AppState>> {
  const keys = [
    'tv_ai_onboarding_done',
    'tv_ai_selected_market',
    'tv_ai_sub_tier',
  ]
  const stored = await chrome.storage.local.get(keys)
  return {
    onboardingComplete: stored.tv_ai_onboarding_done ?? false,
    selectedMarket: stored.tv_ai_selected_market ?? null,
    tier: stored.tv_ai_sub_tier ?? 'free',
  }
}

// ─── Store ─────────────────────────────────────────────────────────

export const useStore = create<AppState>((set, get) => ({
  // Default state
  onboardingComplete: false,
  onboardingStep: OnboardingStep.WELCOME,
  selectedMarket: null,
  lastAnalysis: null,
  analyses: [],
  isAnalyzing: false,
  lastError: null,
  analysisErrorType: null,
  tier: 'free',
  usageRemaining: 5,
  isUnlimited: false,
  panelOpen: false,

  // ── Actions ──

  setPanelOpen: (open) => set({ panelOpen: open }),

  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),

  selectMarket: (market) => {
    set({ selectedMarket: market })
    chrome.runtime.sendMessage({ type: MSG.SET_MARKET, market })
  },

  nextOnboardingStep: () => {
    const { onboardingStep, onboardingComplete } = get()
    if (onboardingComplete) return

    const currentIndex = ONBOARDING_STEPS.indexOf(onboardingStep)
    if (currentIndex < ONBOARDING_STEPS.length - 1) {
      set({ onboardingStep: ONBOARDING_STEPS[currentIndex + 1] })
    }
  },

  skipOnboarding: async (tier) => {
    await chrome.runtime.sendMessage({
      type: MSG.ONBOARDING_COMPLETE,
      tier: tier ?? 'free',
    })
    set({ onboardingComplete: true, onboardingStep: OnboardingStep.WELCOME })
    if (tier) set({ tier })
  },

  setTier: (tier) => {
    set({ tier, isUnlimited: tier === 'pro' || tier === 'elite' })
    chrome.runtime.sendMessage({ type: MSG.SET_TIER, tier })
  },

  triggerAnalysis: async (symbol, timeframe, price) => {
    const { selectedMarket, tier } = get()
    set({ isAnalyzing: true, lastError: null, analysisErrorType: null })

    try {
      const response = await chrome.runtime.sendMessage({
        type: MSG.ANALYZE_CHART,
        context: {
          symbol,
          timeframe,
          currentPrice: price,
          market: selectedMarket,
        },
      })

      if (response?.error) {
        set({
          isAnalyzing: false,
          lastError: response.error,
          analysisErrorType: response.type ?? 'error',
          usageRemaining: response.remaining ?? 0,
        })
        return
      }

      const result: AnalysisResult = response.result
      set({
        isAnalyzing: false,
        lastAnalysis: result,
        analyses: [...get().analyses, result],
        usageRemaining: response.remaining ?? 0,
        isUnlimited: tier === 'pro' || tier === 'elite',
      })
    } catch (err) {
      set({
        isAnalyzing: false,
        lastError: err instanceof Error ? err.message : 'Analysis request failed',
        analysisErrorType: 'communication_error',
      })
    }
  },

  retryAnalysis: async () => {
    const { lastAnalysis } = get()
    if (lastAnalysis) {
      await get().triggerAnalysis(lastAnalysis.symbol, lastAnalysis.timeframe, lastAnalysis.currentPrice)
    }
  },

  resetForNewChart: () => {
    set({
      lastAnalysis: null,
      isAnalyzing: false,
      lastError: null,
      analysisErrorType: null,
    })
  },

  setOnboardingStep: (step) => set({ onboardingStep: step }),
}))

// ─── Initialize from Chrome Storage ────────────────────────────────

loadPersistedState().then((partial) => {
  useStore.setState({
    ...partial,
    isUnlimited: partial.tier === 'pro' || partial.tier === 'elite',
  } as Partial<AppState>)
})

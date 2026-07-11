import { MSG } from '../shared/constants.js'
import type { TierType, MarketType } from '../shared/types.js'
import type { AnalyzeChartMessage, SetMarketMessage, OnboardingCompleteMessage, SetTierMessage, SetGroqKeyMessage, SetBackendUrlMessage, AnalysisResultMessage, AnalysisErrorMessage, UsageUpdateMessage } from '../shared/messages.js'
import { MessageBus } from './messageBus.js'
import * as state from './stateManager.js'
import { analyzeChart, setConfig } from './apiClient.js'

// ─── Service Worker Lifecycle ──────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  state.ensureUserId()
  console.log('[serviceWorker] Installed — user ID ensured')
})

chrome.runtime.onStartup.addListener(() => {
  state.ensureUserId()
  console.log('[serviceWorker] Startup — user ID ensured')
})

// ─── Message Router ────────────────────────────────────────────────

const bus = new MessageBus()

bus.register(MSG.ANALYZE_CHART, async (msg) => {
  const { context, image } = msg as unknown as AnalyzeChartMessage

  // Get state
  const st = await state.getState()
  const tier = st.subTier

  // Check quota (FIX: check before, increment after success)
  const canAnalyze = await state.canAnalyze(tier)
  if (!canAnalyze) {
    const remaining = await state.getRemainingAnalyses(tier)
    return {
      error: `Daily analysis limit reached (${remaining} remaining). Upgrade for unlimited access.`,
      type: 'quota_error',
      remaining,
    }
  }

  // Capture screenshot if no image provided
  let screenshot: string | null = image ?? null
  if (!screenshot) {
    try {
      screenshot = await captureVisibleTab()
    } catch (err) {
      return {
        error: 'Failed to capture chart screenshot. Make sure the TradingView chart tab is visible.',
        type: 'capture_error',
      }
    }
  }

  // Run analysis
  try {
    const result = await analyzeChart(
      context,
      screenshot,
      context.market ?? 'XAUUSD' as MarketType,
      tier,
      await state.ensureUserId(),
    )

    // FIX: Only increment after success
    await state.incrementUsage(tier)
    const remaining = await state.getRemainingAnalyses(tier)

    return {
      result: { ...result, remaining, tier },
      remaining,
    }
  } catch (err) {
    console.error('[serviceWorker] Analysis failed:', err)
    return {
      error: err instanceof Error ? err.message : 'Analysis failed. Please try again.',
      type: 'analysis_error',
    }
  }
})

bus.register(MSG.CAPTURE_VISIBLE_TAB, async () => {
  try {
    const dataUrl = await captureVisibleTab()
    return { dataUrl }
  } catch (err) {
    return { error: String(err) }
  }
})

bus.register(MSG.GET_STATE, async () => {
  return state.getState()
})

bus.register(MSG.SET_MARKET, async (msg) => {
  const { market } = msg as unknown as SetMarketMessage
  await state.setMarket(market)
  return { success: true }
})

bus.register(MSG.ONBOARDING_COMPLETE, async (msg) => {
  const data = msg as unknown as OnboardingCompleteMessage
  await state.setOnboardingComplete()
  if (data.tier) {
    await state.setTier(data.tier)
  }
  return { success: true }
})

bus.register(MSG.SET_TIER, async (msg) => {
  const { tier } = msg as unknown as SetTierMessage
  await state.setTier(tier)
  return { success: true }
})

bus.register(MSG.SET_GROQ_KEY, async (msg) => {
  const { key } = msg as unknown as SetGroqKeyMessage
  await chrome.storage.local.set({ tv_ai_groq_api_key: key })
  setConfig({ groqApiKey: key })
  return { success: true }
})

bus.register(MSG.SET_BACKEND_URL, async (msg) => {
  const { url } = msg as unknown as SetBackendUrlMessage
  await chrome.storage.local.set({ tv_ai_backend_url: url })
  setConfig({ baseUrl: url })
  return { success: true }
})

bus.register(MSG.GET_CONFIG, async () => {
  const { tv_ai_groq_api_key, tv_ai_backend_url } = await chrome.storage.local.get([
    'tv_ai_groq_api_key',
    'tv_ai_backend_url',
  ])
  return {
    baseUrl: tv_ai_backend_url ?? null,
    groqApiKey: tv_ai_groq_api_key ?? null,
    useMock: !tv_ai_groq_api_key && !tv_ai_backend_url,
  }
})

// ─── Register Listener ─────────────────────────────────────────────

chrome.runtime.onMessage.addListener(bus.createListener())

// ─── Helpers ───────────────────────────────────────────────────────

async function captureVisibleTab(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
      } else if (dataUrl) {
        resolve(dataUrl)
      } else {
        reject(new Error('captureVisibleTab returned empty'))
      }
    })
  })
}

import type { ContentToBackground, StateResponse, ConfigResponse, AnalyzeRequest } from '../shared/messages.js'
import { MSG, STORAGE } from '../shared/constants.js'
import type { MarketType, TierType } from '../shared/types.js'

// ─── In-memory state cache ─────────────────────────────────────────
const _cache: Record<string, unknown> = {}

// ─── Public API ────────────────────────────────────────────────────

export async function getState(): Promise<StateResponse> {
  const all = await chrome.storage.local.get(null)
  return {
    onboardingComplete: all[STORAGE.ONBOARDING_DONE] ?? false,
    selectedMarket: all[STORAGE.SELECTED_MARKET] ?? null,
    subTier: (all[STORAGE.SUB_TIER] as TierType) ?? 'free',
    usageRemaining: await getRemainingAnalyses(all[STORAGE.SUB_TIER] ?? 'free'),
  }
}

export async function getUsageToday(): Promise<number> {
  const { [STORAGE.USAGE_DATE]: storedDate, [STORAGE.USAGE_COUNT]: storedCount } =
    await chrome.storage.local.get([STORAGE.USAGE_DATE, STORAGE.USAGE_COUNT])

  const today = new Date().toISOString().split('T')[0]
  if (storedDate !== today) {
    await chrome.storage.local.set({ [STORAGE.USAGE_DATE]: today, [STORAGE.USAGE_COUNT]: 0 })
    return 0
  }
  return (storedCount as number) ?? 0
}

export async function getMonthlyUsage(): Promise<number> {
  const monthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  const { [STORAGE.MONTH_KEY]: storedMonth, [STORAGE.MONTHLY_USAGE]: storedCount } =
    await chrome.storage.local.get([STORAGE.MONTH_KEY, STORAGE.MONTHLY_USAGE])

  if (storedMonth !== monthKey) {
    await chrome.storage.local.set({ [STORAGE.MONTH_KEY]: monthKey, [STORAGE.MONTHLY_USAGE]: 0 })
    return 0
  }
  return (storedCount as number) ?? 0
}

export async function canAnalyze(tier: TierType): Promise<boolean> {
  switch (tier) {
    case 'free': {
      const usage = await getUsageToday()
      return usage < 5
    }
    case 'starter': {
      const usage = await getMonthlyUsage()
      return usage < 100
    }
    case 'pro':
    case 'elite':
      return true
    default:
      return false
  }
}

/**
 * Increments usage — call ONLY after a successful analysis response.
 * (FIX from original: was incrementing before the API call.)
 */
export async function incrementUsage(tier: TierType): Promise<void> {
  if (tier === 'pro' || tier === 'elite') return

  if (tier === 'free') {
    const count = await getUsageToday()
    const today = new Date().toISOString().split('T')[0]
    await chrome.storage.local.set({
      [STORAGE.USAGE_COUNT]: count + 1,
      [STORAGE.USAGE_DATE]: today,
    })
  } else if (tier === 'starter') {
    const count = await getMonthlyUsage()
    const monthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    await chrome.storage.local.set({
      [STORAGE.MONTHLY_USAGE]: count + 1,
      [STORAGE.MONTH_KEY]: monthKey,
    })
  }
}

export async function getRemainingAnalyses(tier: TierType): Promise<number> {
  switch (tier) {
    case 'free': {
      const usage = await getUsageToday()
      return Math.max(0, 5 - usage)
    }
    case 'starter': {
      const usage = await getMonthlyUsage()
      return Math.max(0, 100 - usage)
    }
    case 'pro':
    case 'elite':
      return Infinity
    default:
      return 0
  }
}

// ─── User ID ───────────────────────────────────────────────────────

export async function ensureUserId(): Promise<string> {
  const { [STORAGE.USER_ID]: uid } = await chrome.storage.local.get(STORAGE.USER_ID)
  if (uid) return uid as string

  const newId = `tv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  await chrome.storage.local.set({ [STORAGE.USER_ID]: newId })
  return newId
}

// ─── Direct Storage Access ─────────────────────────────────────────

export async function setMarket(market: MarketType): Promise<void> {
  await chrome.storage.local.set({ [STORAGE.SELECTED_MARKET]: market })
}

export async function setOnboardingComplete(): Promise<void> {
  await chrome.storage.local.set({ [STORAGE.ONBOARDING_DONE]: true })
}

export async function setTier(tier: TierType): Promise<void> {
  await chrome.storage.local.set({ [STORAGE.SUB_TIER]: tier })
}

/**
 * State manager — handles user session state, usage limits,
 * onboarding progress, and subscription tier checks.
 *
 * All state is persisted to chrome.storage.local so it survives
 * service worker restarts (Manifest V3).
 */

import { STORAGE, TIER, TIER_LIMITS } from "../shared/constants.js";

// ─── In-memory cache (faster than async storage for frequent reads) ──
const _cache = {};

// ─── Helpers ──────────────────────────────────────────────────────

async function get(key, fallback = null) {
  if (_cache[key] !== undefined) return _cache[key];
  const result = await chrome.storage.local.get([key]);
  _cache[key] = result[key] ?? fallback;
  return _cache[key];
}

async function set(key, value) {
  _cache[key] = value;
  await chrome.storage.local.set({ [key]: value });
}

// ─── Public API ───────────────────────────────────────────────────

export const StateManager = {
  // ── Onboarding ──────────────────────────────────────────────
  async isOnboardingComplete() {
    return !!(await get(STORAGE.ONBOARDING_DONE, false));
  },

  async setOnboardingComplete() {
    await set(STORAGE.ONBOARDING_DONE, true);
  },

  async getSelectedMarket() {
    return await get(STORAGE.SELECTED_MARKET, null);
  },

  async setSelectedMarket(marketId) {
    await set(STORAGE.SELECTED_MARKET, marketId);
  },

  // ── Usage tracking ──────────────────────────────────────────
  async getUsageToday() {
    const today = new Date().toISOString().slice(0, 10);
    const storedDate = await get(STORAGE.USAGE_DATE, "");
    if (storedDate !== today) {
      await set(STORAGE.USAGE_COUNT, 0);
      await set(STORAGE.USAGE_DATE, today);
      return 0;
    }
    return (await get(STORAGE.USAGE_COUNT, 0));
  },

  async incrementUsage() {
    const today = new Date().toISOString().slice(0, 10);
    const storedDate = await get(STORAGE.USAGE_DATE, "");
    if (storedDate !== today) {
      await set(STORAGE.USAGE_DATE, today);
      await set(STORAGE.USAGE_COUNT, 1);
      return 1;
    }
    const count = (await get(STORAGE.USAGE_COUNT, 0)) + 1;
    await set(STORAGE.USAGE_COUNT, count);
    return count;
  },

  // ── Subscription / Tier ─────────────────────────────────────
  async getTier() {
    return await get(STORAGE.SUBSCRIPTION_TIER, TIER.FREE);
  },

  async setTier(tier) {
    await set(STORAGE.SUBSCRIPTION_TIER, tier);
  },

  async getTierLimits() {
    const tier = await this.getTier();
    return TIER_LIMITS[tier] || TIER_LIMITS[TIER.FREE];
  },

  async canAnalyze() {
    const tier = await this.getTier();
    if (tier === TIER.PRO || tier === TIER.ELITE) return true;

    const usage = await this.getUsageToday();
    const limits = await this.getTierLimits();

    if (tier === TIER.FREE) {
      return usage < limits.analysesPerDay;
    }
    if (tier === TIER.STARTER) {
      const monthly = await this.getMonthlyUsage();
      return monthly < limits.analysesPerMonth;
    }
    return true;
  },

  async getRemainingAnalyses() {
    const tier = await this.getTier();
    const usage = await this.getUsageToday();
    const limits = await this.getTierLimits();

    if (tier === TIER.PRO || tier === TIER.ELITE) return Infinity;
    if (tier === TIER.FREE) return Math.max(0, limits.analysesPerDay - usage);
    if (tier === TIER.STARTER) {
      const monthly = await this.getMonthlyUsage();
      return Math.max(0, limits.analysesPerMonth - monthly);
    }
    return 0;
  },

  // ── Monthly usage (for Starter tier) ────────────────────────
  async getMonthlyUsage() {
    const month = new Date().toISOString().slice(0, 7);
    const storedMonth = await get("tv_ai_month_key", "");
    if (storedMonth !== month) {
      await set("tv_ai_month_key", month);
      await set("tv_ai_monthly_usage", 0);
      return 0;
    }
    return await get("tv_ai_monthly_usage", 0);
  },

  async incrementMonthlyUsage() {
    const month = new Date().toISOString().slice(0, 7);
    const storedMonth = await get("tv_ai_month_key", "");
    if (storedMonth !== month) {
      await set("tv_ai_month_key", month);
      await set("tv_ai_monthly_usage", 1);
      return 1;
    }
    const count = (await get("tv_ai_monthly_usage", 0)) + 1;
    await set("tv_ai_monthly_usage", count);
    return count;
  },

  // ── User ID (anonymous — generated on first install) ────────
  async getUserId() {
    let id = await get(STORAGE.USER_ID, null);
    if (!id) {
      id = "tv_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      await set(STORAGE.USER_ID, id);
    }
    return id;
  },

  // ── Full state dump (for debug / sync) ──────────────────────
  async getAll() {
    return {
      onboardingComplete: await this.isOnboardingComplete(),
      market: await this.getSelectedMarket(),
      tier: await this.getTier(),
      usageToday: await this.getUsageToday(),
      remaining: await this.getRemainingAnalyses(),
      userId: await this.getUserId(),
    };
  },
};

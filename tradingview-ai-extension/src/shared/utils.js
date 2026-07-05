/**
 * Shared utility functions.
 */

/**
 * Generate a short unique ID (for session tracking, user IDs).
 */
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Sleep for ms (async).
 */
export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Safe localStorage wrapper (handles SSR / extension context errors).
 */
export const safeStorage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota exceeded — silently degrade */
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* noop */
    }
  },
};

/**
 * Format a confidence score (0–100) with color class.
 */
export function formatConfidence(score) {
  const clamped = clamp(Math.round(score), 0, 100);
  let level;
  if (clamped >= 75) level = "high";
  else if (clamped >= 50) level = "medium";
  else level = "low";
  return { score: clamped, level };
}

/**
 * Format a price value as a string with appropriate decimals.
 */
export function formatPrice(value, decimals = 2) {
  return Number(value).toFixed(decimals);
}

/**
 * Debounce a function.
 */
export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/**
 * Check if user is on a TradingView chart page.
 */
export function isTradingViewChart() {
  return (
    window.location.hostname.includes("tradingview.com") &&
    (window.location.pathname.includes("/chart/") ||
      window.location.pathname.includes("/symbol/"))
  );
}

/**
 * Create an HTML element with attributes and children.
 */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, val] of Object.entries(attrs)) {
    if (key.startsWith("on") && typeof val === "function") {
      el.addEventListener(key.slice(2).toLowerCase(), val);
    } else if (key === "style" && typeof val === "object") {
      Object.assign(el.style, val);
    } else if (key === "class") {
      el.className = val;
    } else if (key === "dataset") {
      Object.assign(el.dataset, val);
    } else {
      el.setAttribute(key, val);
    }
  }
  for (const child of children) {
    if (child == null) continue;
    el.append(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return el;
}

/**
 * Service Worker — the brain router for the extension.
 *
 * Responsibilities:
 *   - Route messages from content script (analysis requests, screenshots)
 *   - Manage user state (onboarding, usage, subscriptions)
 *   - Capture chart screenshots and forward to the AI pipeline
 *   - Handle tab lifecycle for Manifest V3
 */

import { analyzeChart, setConfig } from "./apiClient.js";
import { StateManager } from "./stateManager.js";
import { MSG } from "../shared/constants.js";
import { onMessage, getHandler } from "../shared/messageBus.js";

// ─── Install / Startup ────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("[TVAIBackground] Installed:", details.reason);
  await StateManager.getUserId();
});

chrome.runtime.onStartup.addListener(async () => {
  console.log("[TVAIBackground] Service worker started");
  await StateManager.getUserId();
});

// ─── Message Router ───────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const handler = getHandler(msg.type);
  if (handler) {
    handler(msg.payload, sender)
      .then(sendResponse)
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (msg.type === MSG.ANALYZE_CHART) {
    handleAnalysis(msg.payload, sender)
      .then(sendResponse)
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  if (msg.type === MSG.CAPTURE_VISIBLE_TAB) {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (image) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ image });
      }
    });
    return true;
  }

  if (msg.type === MSG.GET_STATE) {
    StateManager.getAll().then(sendResponse);
    return true;
  }

  if (msg.type === MSG.SET_MARKET) {
    StateManager.setSelectedMarket(msg.payload.market).then(() =>
      sendResponse({ ok: true })
    );
    return true;
  }

  if (msg.type === MSG.ONBOARDING_COMPLETE) {
    StateManager.setOnboardingComplete().then(() => sendResponse({ ok: true }));
    return true;
  }

  if (msg.type === MSG.SET_TIER) {
    StateManager.setTier(msg.payload.tier).then(() =>
      sendResponse({ ok: true })
    );
    return true;
  }

  // Allow setting the Groq API key at runtime
  if (msg.type === "SET_GROQ_KEY") {
    chrome.storage.local
      .set({ tv_ai_groq_api_key: msg.payload.key })
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  // Allow configuring the backend URL at runtime
  if (msg.type === "SET_BACKEND_URL") {
    chrome.storage.local
      .set({ tv_ai_backend_url: msg.payload.url })
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }

  // Get the current API config (for debugging / settings UI)
  if (msg.type === "GET_CONFIG") {
    import("./apiClient.js")
      .then((mod) => sendResponse(mod.getConfig()))
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }
});

// ─── Analysis Handler ──────────────────────────────────────────────

async function handleAnalysis(payload, sender) {
  try {
    const canAnalyze = await StateManager.canAnalyze();
    if (!canAnalyze) {
      const remaining = await StateManager.getRemainingAnalyses();
      return {
        error: "limit_reached",
        remaining,
        message:
          remaining === 0
            ? "Daily analysis limit reached. Upgrade to Pro for unlimited analysis."
            : "Analysis limit reached for this billing period.",
      };
    }

    // Capture the chart screenshot from the active tab.
    // This runs in the service worker context, giving us access to
    // chrome.tabs.captureVisibleTab, which content scripts don't have.
    let image = null;
    try {
      image = await new Promise((resolve, reject) => {
        chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(dataUrl);
          }
        });
      });
    } catch (err) {
      console.warn(
        "[TVAI] Screenshot capture failed, proceeding without image:",
        err.message
      );
    }

    const result = await analyzeChart({
      context: payload.context,
      image,
    });

    result.remaining = await StateManager.getRemainingAnalyses();
    result.tier = await StateManager.getTier();
    result.market = await StateManager.getSelectedMarket();

    if (image) {
      result._screenshotCaptured = true;
    }

    return result;
  } catch (err) {
    console.error("[TVAIBackground] Analysis error:", err);
    return {
      error: "analysis_failed",
      message: "Chart analysis failed. Please try again.",
      details: err.message,
    };
  }
}

// ─── Register dynamic handlers ────────────────────────────────────

export function registerHandler(type, handler) {
  onMessage(type, handler);
}

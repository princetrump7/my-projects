/**
 * Message bus — typed communication layer between content script,
 * background service worker, and UI.
 *
 * Usage (content script side):
 *   const result = await sendToBackground(MSG.ANALYZE_CHART, payload);
 *
 * Usage (background side):
 *   onMessage(MSG.ANALYZE_CHART, async (payload, sender) => { ... });
 */

// ─── Send message to background service worker ───────────────────
export function sendToBackground(type, payload = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, payload }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

// ─── Send message to a specific tab (manifest v3) ────────────────
export function sendToTab(tabId, type, payload = {}) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, { type, payload }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

// ─── Listen for messages in background ──────────────────────────
const backgroundHandlers = new Map();

export function onMessage(type, handler) {
  backgroundHandlers.set(type, handler);
}

export function offMessage(type) {
  backgroundHandlers.delete(type);
}

export function getHandler(type) {
  return backgroundHandlers.get(type);
}

// ─── Listen for messages in content script ──────────────────────
const contentHandlers = new Map();

export function onContentMessage(type, handler) {
  contentHandlers.set(type, handler);
}

export function offContentMessage(type) {
  contentHandlers.delete(type);
}

export function getContentHandler(type) {
  return contentHandlers.get(type);
}

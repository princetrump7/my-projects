// CareerOS Web Content Script
// Runs on the CareerOS web app to sync authentication state with the extension

(function () {
  "use strict";

  let lastToken = null;

  function getSupabaseToken() {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
        const val = localStorage.getItem(key);
        if (val) {
          try {
            const data = JSON.parse(val);
            const token = data.currentSession?.access_token || data.access_token;
            if (token) {
              return token;
            }
          } catch (e) {
            console.error("CareerOS: Failed to parse auth token", e);
          }
        }
      }
    }
    return null;
  }

  function syncToken() {
    const token = getSupabaseToken();
    if (token && token !== lastToken) {
      lastToken = token;
      chrome.runtime.sendMessage({ action: "setAuthToken", token: token }, (response) => {
        if (chrome.runtime.lastError) {
          // Extension context might be invalidated, ignore
          return;
        }

        console.log("CareerOS: Auth token synchronized!");

        // If this page was opened for extension sign-in, close the popup automatically
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("redirect") === "extension") {
          setTimeout(() => {
            console.log("CareerOS: Closing auth popup...");
            window.close();
          }, 1500);
        }
      });
    }
  }

  // Run on load
  syncToken();

  // Listen for storage changes
  window.addEventListener("storage", (e) => {
    if (e.key && e.key.startsWith("sb-") && e.key.endsWith("-auth-token")) {
      syncToken();
    }
  });

  // Check periodically as a fallback
  setInterval(syncToken, 2000);
})();

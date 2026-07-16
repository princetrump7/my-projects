// CareerOS Extension Background Service Worker (Manifest V3)

// Handle side panel behavior
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error("CareerOS: Failed to set panel behavior:", error));

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "openSidePanel":
      openSidePanel(sender.tab?.id || message.tabId, message.tab);
      break;

    case "getAuthToken":
      getAuthToken().then(sendResponse);
      return true; // Keep the message channel open for async response

    case "setAuthToken":
      setAuthToken(message.token).then(sendResponse);
      return true;

    case "clearAuthToken":
      clearAuthToken().then(sendResponse);
      return true;
  }
});

// Open side panel and switch tab
async function openSidePanel(tabId, tabName = "analyze") {
  if (!tabId) return;

  try {
    await chrome.sidePanel.open({ tabId });

    // Notify the sidebar to switch tabs
    chrome.tabs.sendMessage(tabId, {
      action: "switchTab",
      tab: tabName,
    });
  } catch (error) {
    console.error("CareerOS: Failed to open side panel:", error);
  }
}

// Auth token management in storage
async function getAuthToken() {
  try {
    const result = await chrome.storage.local.get(["supabase_auth_token"]);
    return result.supabase_auth_token || null;
  } catch {
    return null;
  }
}

async function setAuthToken(token) {
  try {
    await chrome.storage.local.set({ supabase_auth_token: token });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function clearAuthToken() {
  try {
    await chrome.storage.local.remove(["supabase_auth_token"]);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Handle extension icon click - opens side panel
chrome.action.onClicked.addListener(async (tab) => {
  await openSidePanel(tab.id);
});

// Track tab navigation for LinkedIn SPA
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    tab.url.includes("linkedin.com")
  ) {
    // Notify any open side panel that the page changed
    chrome.runtime.sendMessage({
      action: "tabChanged",
      tabId,
      url: tab.url,
    }).catch(() => {
      // No listener (side panel not open) — ignore
    });
  }
});

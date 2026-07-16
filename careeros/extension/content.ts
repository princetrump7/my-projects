// CareerOS LinkedIn Content Script
// Injects CareerOS buttons into LinkedIn pages

function isLinkedInProfilePage(): boolean {
  return /^\/in\//.test(window.location.pathname) && window.location.pathname !== "/in/"
}

function isLinkedInJobPage(): boolean {
  return window.location.href.includes("/jobs/")
}

function injectAnalyzeButton(): void {
  if (!isLinkedInProfilePage()) return

  const existingBtn = document.getElementById("careeros-analyze-btn")
  if (existingBtn) return

  const actionSection = document.querySelector(
    ".pv-top-card--list, .profile-rail-card__actions, .ph5"
  )
  if (!actionSection) return

  const btnContainer = document.createElement("div")
  btnContainer.style.cssText = "margin-top: 12px;"

  const btn = document.createElement("button")
  btn.id = "careeros-analyze-btn"
  btn.textContent = "Analyze with CareerOS"
  btn.style.cssText = `
    background: linear-gradient(135deg, #2563eb, #7c3aed);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    width: 100%;
    transition: opacity 0.2s;
  `
  btn.onmouseenter = () => { btn.style.opacity = "0.9" }
  btn.onmouseleave = () => { btn.style.opacity = "1" }

  btn.onclick = () => {
    chrome.runtime.sendMessage({ action: "openSidePanel", tab: "analyze" })
  }

  btnContainer.appendChild(btn)
  actionSection.insertBefore(btnContainer, actionSection.firstChild)
}

function injectOptimizeButton(): void {
  if (!isLinkedInJobPage()) return

  const existingBtn = document.getElementById("careeros-optimize-btn")
  if (existingBtn) return

  const actionBar = document.querySelector(
    ".jobs-apply-button--top-card, .jobs-save-button, .job-details-jobs-unified-top-card__actions"
  )
  if (!actionBar) return

  const btn = document.createElement("button")
  btn.id = "careeros-optimize-btn"
  btn.textContent = "Optimize Your CV for This Job"
  btn.style.cssText = `
    background: linear-gradient(135deg, #2563eb, #7c3aed);
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    margin-left: 8px;
    transition: opacity 0.2s;
  `
  btn.onmouseenter = () => { btn.style.opacity = "0.9" }
  btn.onmouseleave = () => { btn.style.opacity = "1" }

  btn.onclick = () => {
    chrome.runtime.sendMessage({ action: "openSidePanel", tab: "optimize" })
  }

  actionBar.appendChild(btn)
}

// Main injection logic
function inject(): void {
  injectAnalyzeButton()
  injectOptimizeButton()
}

// Run on page load and observe DOM changes
inject()

const observer = new MutationObserver(() => {
  inject()
})

observer.observe(document.body, {
  childList: true,
  subtree: true,
})

// Listen for tab changes within SPA
let lastUrl = window.location.href
const urlObserver = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href
    setTimeout(inject, 1000)
  }
})

urlObserver.observe(document.querySelector("title") || document.body, {
  childList: true,
  subtree: true,
  characterData: true,
})

// Export for webpack
export {}

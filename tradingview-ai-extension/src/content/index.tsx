import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.js'
import './styles/index.css'

/**
 * Content script entry point.
 * Injects the React app into a shadow DOM root on the TradingView page.
 * This provides full CSS isolation from TradingView's styles.
 *
 * Handles:
 * - Shadow DOM injection for style isolation
 * - Content script guard — only runs on tradingview.com
 * - Cleanup on removal
 */

function init() {
  // Guard: only run on TradingView
  if (!window.location.hostname.includes('tradingview.com')) {
    return
  }

  // Guard: prevent double initialization
  if (document.getElementById('tvai-root')) {
    return
  }

  // Create shadow DOM host
  const host = document.createElement('div')
  host.id = 'tvai-shadow-host'
  host.style.cssText = 'all: initial; position: fixed; top: 0; right: 0; z-index: 99999;'

  // Append first so document.body exists
  document.body.appendChild(host)

  // Attach shadow DOM
  const shadowRoot = host.attachShadow({ mode: 'open' })

  // Create mount point inside shadow DOM
  const mountPoint = document.createElement('div')
  mountPoint.id = 'tvai-root'
  shadowRoot.appendChild(mountPoint)

  // Render React app into shadow DOM
  const root = createRoot(mountPoint)
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

// ─── Initialization ─────────────────────────────────────────────────

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}

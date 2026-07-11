import React, { useEffect, useRef } from 'react'
import { useStore } from './store/index.js'
import { FloatingButton } from './components/FloatingButton.js'
import { Panel } from './components/Panel.js'
import { ErrorBoundary } from './components/ErrorBoundary.js'

/**
 * Root application component.
 * Handles SPA navigation detection via URL change observation.
 * Manages lifecycle cleanup.
 * Wrapped in ErrorBoundary for graceful failure recovery.
 */
export const App: React.FC = () => {
  const resetForNewChart = useStore((s) => s.resetForNewChart)
  const lastUrlRef = useRef(window.location.href)

  // Listen for SPA navigation changes (TradingView is an SPA)
  useEffect(() => {
    let lastUrl = window.location.href
    const observer = new MutationObserver(() => {
      const currentUrl = window.location.href
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl
        lastUrlRef.current = currentUrl
        resetForNewChart()
      }
    })

    // Watch head for URL changes (SPA)
    observer.observe(document.querySelector('head') ?? document.documentElement, {
      childList: true,
      subtree: true,
      characterData: false,
    })

    // Also watch title changes as an SPA navigation signal
    const titleEl = document.querySelector('title')
    if (titleEl) {
      observer.observe(titleEl, { childList: true })
    }

    return () => {
      observer.disconnect()
    }
  }, [resetForNewChart])

  return (
    <ErrorBoundary>
      <FloatingButton />
      <Panel />
    </ErrorBoundary>
  )
}

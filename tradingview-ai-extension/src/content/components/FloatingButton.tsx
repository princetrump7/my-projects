import React from 'react'
import { useStore } from '../store/index.js'

/**
 * Floating "AI" button fixed to bottom-right of the TradingView page.
 * Click toggles the panel open/closed.
 */
export const FloatingButton: React.FC = () => {
  const panelOpen = useStore((s) => s.panelOpen)
  const togglePanel = useStore((s) => s.togglePanel)

  if (panelOpen) return null

  return (
    <button
      id="tvai-btn"
      onClick={togglePanel}
      className={`
        fixed bottom-6 right-6 z-[99999]
        flex items-center gap-2
        px-4 h-[40px] rounded-full
        bg-tv-blue text-white text-sm font-medium
        shadow-lg shadow-tv-blue/20
        transition-all duration-200 ease-out
        hover:bg-tv-blue-hover hover:shadow-tv-blue/30
        active:scale-95
      `}
      aria-label="Open AI Trading Assistant"
      title="AI Trading Assistant"
    >
      <span>AI</span>
      <span className="text-base">🤖</span>
    </button>
  )
}

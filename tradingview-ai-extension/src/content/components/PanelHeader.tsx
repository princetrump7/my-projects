import React from 'react'
import { useStore } from '../store/index.js'
import { TIER_LABELS } from '../../shared/constants.js'

/**
 * Panel header with branding, tier badge, and close button.
 */
export const PanelHeader: React.FC = () => {
  const setPanelOpen = useStore((s) => s.setPanelOpen)
  const tier = useStore((s) => s.tier)

  const badgeClass = tier === 'free'
    ? 'tv-badge-free'
    : tier === 'starter'
      ? 'tv-badge-starter'
      : tier === 'pro'
        ? 'tv-badge-pro'
        : 'tv-badge-elite'

  return (
    <div className="flex items-center gap-2 px-4 h-[44px] border-b border-tv-border bg-tv-surface shrink-0">
      {/* Logo / Title */}
      <span className="text-sm font-bold text-tv-text">AI</span>
      <span className="text-[11px] text-tv-text-secondary font-medium">Copilot</span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Tier badge */}
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${badgeClass}`}>
        {TIER_LABELS[tier]}
      </span>

      {/* Close button */}
      <button
        id="tvai-close"
        onClick={() => setPanelOpen(false)}
        className="w-7 h-7 flex items-center justify-center rounded hover:bg-tv-surface-2 text-tv-text-secondary hover:text-tv-text transition-colors text-sm"
        aria-label="Close panel"
      >
        ✕
      </button>
    </div>
  )
}

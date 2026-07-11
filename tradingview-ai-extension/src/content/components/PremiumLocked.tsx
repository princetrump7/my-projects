import React from 'react'

interface Props {
  title?: string
  count?: number
  children: React.ReactNode
}

/**
 * Locked premium content section with blur overlay.
 * FIX: Parent must have position: relative for overlay to cover correctly.
 */
export const PremiumLocked: React.FC<Props> = ({
  title = 'Premium Insights',
  count = 0,
  children,
}) => {
  return (
    <div className="relative overflow-hidden rounded-lg border border-tv-border" style={{ minHeight: 100 }}>
      {/* Content (blurred) */}
      <div className="tv-locked-blur">
        {children}
      </div>

      {/* Overlay with CTA */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10 bg-tv-bg/60 backdrop-blur-[1px]">
        <p className="text-tv-text-secondary text-xs font-medium">{title}</p>
        {count > 0 && (
          <p className="text-tv-text-muted text-[11px]">{count} more with Pro</p>
        )}
        <button
          className="btn-primary text-xs !h-[30px] !px-3"
          onClick={() => window.dispatchEvent(new CustomEvent('tvai-show-pricing'))}
        >
          Upgrade to Pro →
        </button>
      </div>
    </div>
  )
}

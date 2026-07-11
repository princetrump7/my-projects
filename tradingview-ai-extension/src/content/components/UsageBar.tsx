import React from 'react'

interface Props {
  remaining: number
  max?: number
}

/**
 * Animated usage progress bar.
 * Shows remaining/free for free tier, "Unlimited" for paid.
 */
export const UsageBar: React.FC<Props> = ({ remaining, max = 5 }) => {
  const isUnlimited = remaining === Infinity
  const pct = Math.min(100, ((max - remaining) / max) * 100)

  return (
    <div className="flex items-center gap-2">
      <div className="tv-usage-bar flex-1">
        <div
          className="tv-usage-bar-fill"
          style={{ width: `${isUnlimited ? 100 : pct}%` }}
        />
      </div>
      <span className="text-[11px] text-tv-text-muted whitespace-nowrap">
        {isUnlimited ? 'Unlimited' : `${remaining}/${max}`}
      </span>
    </div>
  )
}

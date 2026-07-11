import React, { useState } from 'react'
import { useOnboarding } from '../hooks/useOnboarding.js'
import { useStore } from '../store/index.js'
import { MARKETS } from '../../shared/constants.js'
import { MarketType } from '../../shared/types.js'

/**
 * Step 2: Market Selection — choose a market to analyze.
 */
export const MarketSelectStep: React.FC = () => {
  const { advance } = useOnboarding()
  const selectMarket = useStore((s) => s.selectMarket)
  const selectedMarket = useStore((s) => s.selectedMarket)
  const [selected, setSelected] = useState<MarketType | null>(selectedMarket)

  const handleSelect = (market: MarketType) => {
    setSelected(market)
    selectMarket(market)
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <div className="text-center">
        <h2 className="text-sm font-bold text-tv-text mb-1">What market do you trade?</h2>
        <p className="text-xs text-tv-text-secondary">
          This helps us calibrate the AI analysis
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {MARKETS.map((m) => (
          <button
            key={m.id}
            className={`
              flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all
              ${selected === m.id
                ? 'bg-tv-blue/10 border-2 border-tv-blue text-tv-blue'
                : 'bg-tv-surface border border-tv-border text-tv-text hover:border-tv-text-muted'
              }
            `}
            onClick={() => handleSelect(m.id)}
          >
            <span className="text-lg">{m.emoji}</span>
            <span className="text-sm font-medium">{m.label}</span>
          </button>
        ))}
      </div>

      <button
        className="btn-primary mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!selected}
        onClick={advance}
      >
        Continue
      </button>
    </div>
  )
}

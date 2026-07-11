import React from 'react'
import { useOnboarding } from '../hooks/useOnboarding.js'

/**
 * Step 1: Welcome — landing screen with feature list.
 */
export const WelcomeStep: React.FC = () => {
  const { advance, skip } = useOnboarding()

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <div className="text-center">
        <div className="text-3xl mb-3">🧠</div>
        <h1 className="text-base font-bold text-tv-text mb-1">
          AI Trading Copilot
        </h1>
        <p className="text-xs text-tv-text-secondary">
          Institutional-grade ICT & Smart Money analysis, powered by AI
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {[
          'Real-time market structure detection',
          'Liquidity sweep & order block analysis',
          'Entry zone, stop loss & take profit levels',
          'BOS, CHoCH & institutional bias scoring',
        ].map((f, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-tv-text-secondary bg-tv-surface rounded-lg px-3 py-2.5 border border-tv-border">
            <span className="text-tv-green">✓</span>
            <span>{f}</span>
          </div>
        ))}
      </div>

      <button className="btn-primary mt-2" onClick={advance}>
        Get Started
      </button>
      <button className="btn-text" onClick={() => skip()}>
        Skip onboarding
      </button>
    </div>
  )
}

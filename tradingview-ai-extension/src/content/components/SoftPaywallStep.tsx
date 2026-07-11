import React from 'react'
import { useOnboarding } from '../hooks/useOnboarding.js'
import { useStore } from '../store/index.js'
import { PremiumLocked } from './PremiumLocked.js'

/**
 * Step 7: Soft Paywall — comparison of Free vs Pro features.
 * Shows blurred premium content with score projection.
 */
export const SoftPaywallStep: React.FC = () => {
  const { advance, goTo } = useOnboarding()
  const lastAnalysis = useStore((s) => s.lastAnalysis)

  const currentScore = lastAnalysis?.scores.overall ?? 72
  const projectedScore = Math.min(100, currentScore + 17)

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <div className="text-center">
        <h2 className="text-sm font-bold text-tv-text mb-1">Your Premium Preview</h2>
        <p className="text-xs text-tv-text-secondary">
          See what you're missing with Pro
        </p>
      </div>

      {/* Free vs Pro comparison */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-tv-surface border border-tv-border rounded-lg p-3">
          <h3 className="text-xs font-bold text-tv-text-muted uppercase mb-2">Free</h3>
          <div className="flex flex-col gap-1.5">
            <FeatureRow included label="Basic signal" />
            <FeatureRow included label="2 reasoning items" />
            <FeatureRow excluded label="Market structure" />
            <FeatureRow excluded label="R:R ratio" />
            <FeatureRow excluded label="Multi-timeframe" />
          </div>
        </div>
        <div className="bg-tv-surface-2 border border-tv-yellow rounded-lg p-3">
          <h3 className="text-xs font-bold text-tv-yellow uppercase mb-2">Pro</h3>
          <div className="flex flex-col gap-1.5">
            <FeatureRow included label="Advanced signal" />
            <FeatureRow included label="Unlimited reasoning" />
            <FeatureRow included label="Market structure" />
            <FeatureRow included label="R:R optimization" />
            <FeatureRow included label="Multi-timeframe" />
          </div>
        </div>
      </div>

      {/* Score projection */}
      <div className="bg-tv-green/5 border border-tv-green/20 rounded-lg p-3 text-center">
        <span className="text-xs text-tv-text-secondary">
          Your score could improve from{' '}
          <span className="text-tv-yellow font-bold">{currentScore}</span>
          {' → '}
          <span className="text-tv-green font-bold">{projectedScore}</span>
          {' with H4 data'}
        </span>
      </div>

      {/* Blurred premium section */}
      <PremiumLocked title="Multi-Timeframe Analysis" count={3}>
        <div className="flex flex-col gap-2 p-3">
          <div className="h-8 bg-tv-surface-2 rounded" />
          <div className="h-8 bg-tv-surface-2 rounded" />
          <div className="h-8 bg-tv-surface-2 rounded" />
        </div>
      </PremiumLocked>

      <button className="btn-primary" onClick={() => goTo('PRICING' as any)}>
        View Plans →
      </button>
      <button className="btn-text" onClick={advance}>
        Maybe later
      </button>
    </div>
  )
}

const FeatureRow: React.FC<{ included: boolean; label: string }> = ({ included, label }) => (
  <div className="flex items-center gap-1.5 text-[11px]">
    <span className={included ? 'text-tv-green' : 'text-tv-text-muted'}>
      {included ? '✓' : '—'}
    </span>
    <span className={included ? 'text-tv-text-secondary' : 'text-tv-text-muted'}>
      {label}
    </span>
  </div>
)

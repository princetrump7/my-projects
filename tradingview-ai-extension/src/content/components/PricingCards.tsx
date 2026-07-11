import React from 'react'
import { useStore } from '../store/index.js'
import { useOnboarding } from '../hooks/useOnboarding.js'
import { TIER_PRICES, TIER_LABELS } from '../../shared/constants.js'
import { TierType } from '../../shared/types.js'

/**
 * Pricing plan selection cards.
 * Shows 3 plans (Starter, Pro, Elite) with feature highlights.
 * Selecting a plan sets the tier via the store.
 */
export const PricingCards: React.FC = () => {
  const setTier = useStore((s) => s.setTier)
  const { skip } = useOnboarding()
  const currentTier = useStore((s) => s.tier)

  const plans = [
    {
      tier: TierType.STARTER,
      featured: false,
      features: ['100 analyses/month', 'Full signal details'],
    },
    {
      tier: TierType.PRO,
      featured: true,
      features: [
        'Unlimited analyses',
        'Multi-timeframe analysis',
        'Market structure overlay',
        'R:R ratio optimization',
        'High-probability filter',
      ],
    },
    {
      tier: TierType.ELITE,
      featured: false,
      features: [
        'Everything in Pro',
        'Strategy presets',
        'Session bias analysis',
        'Priority processing',
      ],
    },
  ]

  const handleSelectPlan = async (tier: TierType) => {
    setTier(tier)
    await skip(tier)
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <div className="text-center mb-2">
        <h2 className="text-base font-bold text-tv-text">Choose Your Plan</h2>
        <p className="text-xs text-tv-text-secondary mt-1">Unlock the full institutional toolkit</p>
      </div>

      {plans.map(({ tier, featured, features }) => {
        const price = TIER_PRICES[tier]
        const isCurrent = currentTier === tier

        return (
          <div
            key={tier}
            className={`
              rounded-lg border p-4 cursor-pointer transition-all duration-200
              ${featured
                ? 'border-tv-yellow bg-tv-surface-2 shadow-md shadow-tv-yellow/5'
                : 'border-tv-border bg-tv-surface hover:border-tv-text-muted'
              }
              ${isCurrent ? 'ring-2 ring-tv-blue' : ''}
            `}
            onClick={() => handleSelectPlan(tier)}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-tv-text">{TIER_LABELS[tier]}</h3>
                <p className="text-[11px] text-tv-text-secondary">{price.description}</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-tv-text">${price.monthly}</span>
                <span className="text-[11px] text-tv-text-muted">/mo</span>
              </div>
            </div>

            {featured && (
              <div className="mb-2">
                <span className="text-[10px] font-bold text-tv-yellow uppercase tracking-wider">Most Popular</span>
              </div>
            )}

            <ul className="flex flex-col gap-1.5">
              {features.map((f, i) => (
                <li key={i} className="flex items-center gap-1.5 text-[11px] text-tv-text-secondary">
                  <span className="text-tv-green">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )
      })}

      <p className="text-[10px] text-tv-text-muted text-center mt-2">
        Cancel anytime. No questions asked.
      </p>
    </div>
  )
}

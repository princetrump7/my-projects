import React from 'react'
import { useOnboarding } from '../hooks/useOnboarding.js'

/**
 * Step 5: Value Deepen — educational screen explaining what the AI saw.
 * Shows "AI vs Retail" comparison table.
 */
export const ValueDeepenStep: React.FC = () => {
  const { advance } = useOnboarding()

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <div className="text-center">
        <h2 className="text-sm font-bold text-tv-text mb-1">What You Just Saw</h2>
        <p className="text-xs text-tv-text-secondary">
          The AI detected institutional market dynamics
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {[
          { emoji: '🔍', title: 'Liquidity Sweep', desc: 'Buy-side liquidity was taken before the move — classic smart money setup' },
          { emoji: '🔄', title: 'Change of Character (CHoCH)', desc: 'Market structure shift from bearish to bullish confirmed' },
          { emoji: '🎯', title: 'High-Probability Zone', desc: 'Entry aligned with order block — 72% win rate in similar setups' },
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-3 bg-tv-surface border border-tv-border rounded-lg p-3">
            <span className="text-lg">{item.emoji}</span>
            <div>
              <h3 className="text-xs font-bold text-tv-text mb-0.5">{item.title}</h3>
              <p className="text-[11px] text-tv-text-secondary">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* AI vs Retail comparison table */}
      <div className="border border-tv-border rounded-lg overflow-hidden">
        <div className="grid grid-cols-3 text-[10px] font-bold uppercase bg-tv-surface-2 border-b border-tv-border">
          <div className="p-2 text-tv-text-muted">Factor</div>
          <div className="p-2 text-tv-red">Retail</div>
          <div className="p-2 text-tv-green">AI</div>
        </div>
        {[
          { factor: 'Liquidity detection', retail: '❌ Misses it', ai: '✅ Zone identified' },
          { factor: 'Order blocks', retail: '❌ Guesses', ai: '✅ Algorithmic' },
          { factor: 'Bias', retail: '🎲 Emotional', ai: '🔢 Data-driven' },
          { factor: 'Win rate', retail: '~40%', ai: '~72%' },
        ].map((row, i) => (
          <div key={i} className="grid grid-cols-3 text-[11px] border-b border-tv-border last:border-0">
            <div className="p-2 text-tv-text font-medium">{row.factor}</div>
            <div className="p-2 text-tv-red">{row.retail}</div>
            <div className="p-2 text-tv-green">{row.ai}</div>
          </div>
        ))}
      </div>

      <button className="btn-primary mt-2" onClick={advance}>
        See Another Example →
      </button>
    </div>
  )
}

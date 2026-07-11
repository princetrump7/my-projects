import React, { useEffect, useState, useRef } from 'react'
import { useOnboarding } from '../hooks/useOnboarding.js'
import { useStore } from '../store/index.js'
import { useTradingView } from '../hooks/useTradingView.js'
import { LoadingSpinner } from './LoadingSpinner.js'

/**
 * Step 6: Second Analysis Loop — shows a "no setup" card with avoid-trading recommendation.
 * FIX: Gracefully handles missing lastAnalysis (was a crash point in the original).
 */
export const SecondLoopStep: React.FC = () => {
  const { advance } = useOnboarding()
  const triggerAnalysis = useStore((s) => s.triggerAnalysis)
  const isAnalyzing = useStore((s) => s.isAnalyzing)
  const lastAnalysis = useStore((s) => s.lastAnalysis)
  const tier = useStore((s) => s.tier)
  const analyses = useStore((s) => s.analyses)
  const { getChartContext, getContextWithRetry } = useTradingView()
  const [initiated, setInitiated] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    if (initiated || analyses.length > 1) return
    setInitiated(true)

    const run = async () => {
      let ctx = getChartContext()
      if (!ctx) ctx = await getContextWithRetry(1, 1000)
      if (!ctx || !mountedRef.current) return

      await triggerAnalysis(ctx.symbol, ctx.timeframe, ctx.currentPrice)
    }

    run()
    return () => { mountedRef.current = false }
  }, [getChartContext, getContextWithRetry, triggerAnalysis, initiated, analyses.length])

  // Auto-advance to paywall after 4 seconds once result is shown
  const firstSymbol = lastAnalysis?.symbol ?? 'Chart'
  const firstTimeframe = lastAnalysis?.timeframe ?? 'current'

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <div className="text-center">
        <h2 className="text-sm font-bold text-tv-text mb-1">Second Analysis</h2>
        <p className="text-xs text-tv-text-secondary">
          Let's run another scan to confirm consistency
        </p>
      </div>

      {isAnalyzing ? (
        <LoadingSpinner
          label="Running second analysis pass..."
          currentStep={0}
        />
      ) : (
        <div className="bg-tv-surface border border-tv-border rounded-lg p-4 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-tv-red/10 flex items-center justify-center text-2xl">
            🚫
          </div>
          <span className="text-xs font-bold text-tv-red">NO SETUP</span>
          <p className="text-xs text-tv-text-secondary text-center">
            No high-probability setup detected on {firstSymbol} ({firstTimeframe}).
            Recommend avoiding trade.
          </p>
          <AutoAdvance onAdvance={advance} />
        </div>
      )}

      {!isAnalyzing && (
        <>
          <button className="btn-primary" onClick={advance}>
            Continue →
          </button>
        </>
      )}
    </div>
  )
}

/**
 * Auto-advances after 4 seconds with a countdown.
 */
const AutoAdvance: React.FC<{ onAdvance: () => void }> = ({ onAdvance }) => {
  const [countdown, setCountdown] = useState(4)

  useEffect(() => {
    if (countdown <= 0) {
      onAdvance()
      return
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, onAdvance])

  return (
    <p className="text-[10px] text-tv-text-muted">
      Auto-advancing in {countdown}s
    </p>
  )
}

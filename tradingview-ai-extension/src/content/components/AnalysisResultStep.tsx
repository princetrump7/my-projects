import React, { useEffect, useRef, useState } from 'react'
import { useOnboarding } from '../hooks/useOnboarding.js'
import { useStore } from '../store/index.js'
import { useTradingView } from '../hooks/useTradingView.js'
import { PremiumLocked } from './PremiumLocked.js'
import { LoadingSpinner } from './LoadingSpinner.js'
import type { AnalysisResult } from '../../shared/types.js'

/**
 * Step 4: First Analysis Result — shows the first real analysis during onboarding.
 */
export const AnalysisResultStep: React.FC = () => {
  const { advance } = useOnboarding()
  const { getChartContext, getContextWithRetry } = useTradingView()
  const triggerAnalysis = useStore((s) => s.triggerAnalysis)
  const lastAnalysis = useStore((s) => s.lastAnalysis)
  const isAnalyzing = useStore((s) => s.isAnalyzing)
  const lastError = useStore((s) => s.lastError)
  const [initiated, setInitiated] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    if (initiated) return
    setInitiated(true)

    const run = async () => {
      let ctx = getChartContext()
      if (!ctx) ctx = await getContextWithRetry(2, 1500)
      if (!ctx || !mountedRef.current) return

      await triggerAnalysis(ctx.symbol, ctx.timeframe, ctx.currentPrice)
    }

    run()
    return () => { mountedRef.current = false }
  }, [getChartContext, getContextWithRetry, triggerAnalysis, initiated])

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <div className="text-center">
        <h2 className="text-sm font-bold text-tv-text mb-1">AI Analysis</h2>
        <p className="text-xs text-tv-text-secondary">Here's what the AI sees on your chart</p>
      </div>

      {isAnalyzing && (
        <LoadingSpinner
          steps={['Analyzing market structure', 'Detecting liquidity zones', 'Computing bias & score']}
          currentStep={0}
          label="Running AI analysis..."
        />
      )}

      {lastError && (
        <div className="text-center text-tv-red text-xs py-4">{lastError}</div>
      )}

      {lastAnalysis && !isAnalyzing && (
        <OnboardingFirstResult analysis={lastAnalysis} />
      )}

      {lastAnalysis && !isAnalyzing && (
        <>
          <button className="btn-primary mt-2" onClick={advance}>
            See How It Works →
          </button>
          <button className="btn-text" onClick={() => advance()}>
            Skip explanation
          </button>
        </>
      )}
    </div>
  )
}

/**
 * First result card shown during onboarding — simplified version of AnalysisDisplay.
 */
const OnboardingFirstResult: React.FC<{ analysis: AnalysisResult }> = ({ analysis }) => {
  const biasClass = analysis.bias === 'bullish' ? 'tv-bias-bullish'
    : analysis.bias === 'bearish' ? 'tv-bias-bearish'
    : 'tv-bias-neutral'

  const scoreColor = analysis.scores.overall >= 75 ? 'tv-score-high'
    : analysis.scores.overall >= 55 ? 'tv-score-medium'
    : 'tv-score-low'

  return (
    <div className="flex flex-col gap-3 bg-tv-surface border border-tv-border rounded-lg p-3">
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded ${biasClass}`}>
          {analysis.bias.toUpperCase()}
        </span>
        <span className={`text-sm font-bold ${scoreColor}`}>
          Score: {analysis.scores.overall}/100
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex flex-col">
          <span className="text-[11px] text-tv-text-muted">Entry Zone</span>
          <span className="font-medium text-tv-text">${analysis.entryZone[0]} – ${analysis.entryZone[1]}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] text-tv-text-muted">Stop Loss</span>
          <span className="font-medium text-tv-red">${analysis.stopLoss}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] text-tv-text-muted">Take Profit 1</span>
          <span className="font-medium text-tv-green">${analysis.takeProfit1}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] text-tv-text-muted">Take Profit 2</span>
          <span className="font-medium text-tv-green">${analysis.takeProfit2}</span>
        </div>
      </div>

      {/* Reasoning */}
      <div>
        <h4 className="text-[10px] font-bold text-tv-text-muted uppercase mb-1.5">Key Reasoning</h4>
        <ul className="flex flex-col gap-1">
          {analysis.reasoning.slice(0, 3).map((r, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[11px] text-tv-text-secondary">
              <span className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                r.type === 'bullish' ? 'bg-tv-green' : r.type === 'bearish' ? 'bg-tv-red' : 'bg-tv-text-muted'
              }`} />
              <span>{r.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

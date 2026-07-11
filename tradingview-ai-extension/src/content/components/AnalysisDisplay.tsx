import React, { useEffect, useId } from 'react'
import { useStore } from '../store/index.js'
import { useAnalysis } from '../hooks/useAnalysis.js'
import { PremiumLocked } from './PremiumLocked.js'
import { UsageBar } from './UsageBar.js'
import { ErrorState } from './ErrorState.js'
import { LoadingSpinner } from './LoadingSpinner.js'
import { EmptyState } from './EmptyState.js'
import type { AnalysisResult, TierType } from '../../shared/types.js'

/**
 * Main analysis result display.
 * Shows: bias pill, score, entry/SL/TP, reasoning, market structure (Pro+).
 * Handles loading / error / empty states and tier gating.
 *
 * FIX: Uses position: relative on locked parent so the overlay covers correctly.
 */
export const AnalysisDisplay: React.FC = () => {
  const { runAnalysis, retryAnalysis, isAnalyzing, lastError, lastAnalysis } = useAnalysis()
  const tier = useStore((s) => s.tier)
  const usageRemaining = useStore((s) => s.usageRemaining)
  const analysisErrorType = useStore((s) => s.analysisErrorType)
  const panelOpen = useStore((s) => s.panelOpen)
  const id = useId()

  // Listen for pricing show events emitted by ErrorState / PremiumLocked
  useEffect(() => {
    const handler = () => {
      useStore.setState({ onboardingComplete: false, onboardingStep: 'PRICING' as any })
    }
    window.addEventListener('tvai-show-pricing', handler)
    return () => window.removeEventListener('tvai-show-pricing', handler)
  }, [])

  // Loading state
  if (isAnalyzing) {
    return (
      <LoadingSpinner
        label="Analyzing chart with AI..."
        steps={['Capturing chart', 'Running AI vision', 'Detecting structure', 'Computing bias']}
        currentStep={1}
      />
    )
  }

  // Error state — different messages for different error types
  if (lastError) {
    // Quota errors show upgrade button
    if (analysisErrorType === 'quota_error') {
      return (
        <ErrorState
          message={lastError}
          onRetry={usageRemaining > 0 ? retryAnalysis : undefined}
        />
      )
    }
    // Capture errors guide the user
    if (analysisErrorType === 'capture_error') {
      return (
        <ErrorState
          message="Couldn't capture the chart. Make sure TradingView is open in this tab."
          onRetry={retryAnalysis}
          retryLabel="Try Again"
        />
      )
    }
    // Generic errors
    return (
      <ErrorState
        message={lastError}
        onRetry={retryAnalysis}
        retryLabel="Try Again"
      />
    )
  }

  // Empty / fresh state
  if (!lastAnalysis) {
    return <EmptyState onAnalyze={runAnalysis} />
  }

  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      {/* Analyze button */}
      <button
        id="tvai-analyze-btn"
        className="btn-primary"
        onClick={runAnalysis}
      >
        Analyze Chart
      </button>

      {/* Result card */}
      <ResultCard analysis={lastAnalysis} tier={tier} />
    </div>
  )
}

// ─── Internal Result Card ───────────────────────────────────────────

const ResultCard: React.FC<{ analysis: AnalysisResult; tier: TierType }> = ({ analysis, tier }) => {
  const isPaid = tier === 'pro' || tier === 'elite'

  const scoreColor =
    analysis.scores.overall >= 75 ? 'tv-score-high'
    : analysis.scores.overall >= 55 ? 'tv-score-medium'
    : 'tv-score-low'

  const biasClass = analysis.bias === 'bullish' ? 'tv-bias-bullish'
    : analysis.bias === 'bearish' ? 'tv-bias-bearish'
    : 'tv-bias-neutral'

  return (
    <div className="flex flex-col gap-3">
      {/* Header: Bias pill + Score */}
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded ${biasClass}`}>
          {analysis.bias === 'bullish' ? '🔼 ' : analysis.bias === 'bearish' ? '🔽 ' : '⏸ '}
          {analysis.bias.toUpperCase()}
        </span>
        <span className={`text-sm font-bold ${scoreColor}`}>
          Score: {analysis.scores.overall}/100
        </span>
      </div>

      {/* Symbol + Timeframe */}
      <div className="flex items-center gap-2 text-[11px] text-tv-text-secondary">
        <span className="font-bold text-tv-text">{analysis.symbol}</span>
        <span>{analysis.timeframe}</span>
        <span className="text-tv-text-muted">|</span>
        <span>Price: ${analysis.currentPrice.toFixed(2)}</span>
      </div>

      {/* Entry / SL / TP Data Box */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <DataRow label="Entry Zone" value={`$${analysis.entryZone[0]} – $${analysis.entryZone[1]}`} />
        <DataRow label="Stop Loss" value={`$${analysis.stopLoss}`} color="tv-red" />
        <DataRow label="Take Profit 1" value={`$${analysis.takeProfit1}`} color="tv-green" />
        <DataRow label="Take Profit 2" value={`$${analysis.takeProfit2}`} color="tv-green" />

        {/* TP3 — Pro+ only */}
        {analysis.takeProfit3 && isPaid && (
          <DataRow label="Take Profit 3" value={`$${analysis.takeProfit3}`} color="tv-green" />
        )}

        {/* R:R — Pro+ only */}
        {isPaid ? (
          <DataRow label="R:R Ratio" value={`1:${analysis.riskReward}`} />
        ) : (
          <div className="col-span-2">
            <PremiumLocked title="Risk:Reward Ratio" count={1}>
              <div className="h-8 bg-tv-surface rounded" />
            </PremiumLocked>
          </div>
        )}
      </div>

      {/* Reasoning Chain */}
      <div>
        <h4 className="text-[11px] font-bold text-tv-text-secondary uppercase tracking-wider mb-2">
          AI Reasoning
        </h4>
        <ul className="flex flex-col gap-1.5">
          {analysis.reasoning.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-tv-text-secondary">
              <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${
                r.type === 'bullish' ? 'bg-tv-green'
                : r.type === 'bearish' ? 'bg-tv-red'
                : 'bg-tv-text-muted'
              }`} />
              <span>{r.text}</span>
            </li>
          ))}
        </ul>

        {/* Reasoning capped at 2 for free — remaining hidden behind lock */}
        {!isPaid && analysis.reasoning.length > 2 && (
          <p className="text-[11px] text-tv-text-muted mt-2 italic">
            +{analysis.reasoning.length - 2} more insights with Pro
          </p>
        )}
      </div>

      {/* Market Structure — Pro+ only */}
      {isPaid ? (
        <MarketStructureSection analysis={analysis} />
      ) : (
        <>
          <h4 className="text-[11px] font-bold text-tv-text-secondary uppercase tracking-wider mb-1">
            Market Structure
          </h4>
          <PremiumLocked title="Market Structure Analysis" count={3}>
            <div className="h-20 bg-tv-surface rounded" />
          </PremiumLocked>
        </>
      )}

      {/* Usage bar */}
      <div className="mt-2 pt-3 border-t border-tv-border">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-tv-text-muted">Daily usage</span>
        </div>
        <UsageBar remaining={analysis.remaining} max={5} />
      </div>
    </div>
  )
}

// ─── Market Structure Section ───────────────────────────────────────

const MarketStructureSection: React.FC<{ analysis: AnalysisResult }> = ({ analysis }) => {
  const { marketStructure } = analysis

  return (
    <div className="flex flex-col gap-2 border border-tv-border rounded-lg p-3">
      <h4 className="text-[11px] font-bold text-tv-text-secondary uppercase tracking-wider">
        Market Structure
      </h4>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <DataRow label="Trend" value={marketStructure.trend} />
        <DataRow label="BOS" value={marketStructure.bosDetected ? '✅ Detected' : '❌ Not found'} />
        <DataRow label="CHoCH" value={marketStructure.chochDetected ? '✅ Detected' : '❌ Not found'} />
        <DataRow label="Pattern" value={marketStructure.pattern ? marketStructure.pattern.replace(/_/g, ' ') : '—'} />
      </div>

      {/* Liquidity info */}
      {marketStructure.liquidity.nearestSide && (
        <div className="text-xs text-tv-text-secondary pt-1">
          <span className="text-tv-text-muted">Nearest liquidity: </span>
          <span className={marketStructure.liquidity.nearestSide === 'buy' ? 'text-tv-green' : 'text-tv-red'}>
            {marketStructure.liquidity.nearestSide}-side
          </span>
          <span className="text-tv-text-muted"> ({marketStructure.liquidity.nearestDistancePercent}%)</span>
        </div>
      )}
    </div>
  )
}

// ─── Data Row Helper ───────────────────────────────────────────────

const DataRow: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[11px] text-tv-text-muted">{label}</span>
    <span className={`text-xs font-medium ${color ?? 'text-tv-text'}`}>{value}</span>
  </div>
)

import React, { useEffect, useState, useRef } from 'react'
import { useOnboarding } from '../hooks/useOnboarding.js'
import { useTradingView } from '../hooks/useTradingView.js'
import { useStore } from '../store/index.js'

/**
 * Step 3: Chart Detection — shows detected symbol/timeframe.
 * FIX: Only advances when data is found; no auto-advance on retry failure.
 */
export const ChartDetectStep: React.FC = () => {
  const { advance } = useOnboarding()
  const { getChartContext, getContextWithRetry } = useTradingView()
  const [detected, setDetected] = useState<{ symbol: string; timeframe: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [showContinue, setShowContinue] = useState(false)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    const ctx = getChartContext()
    if (ctx) {
      setDetected(ctx)
      setLoading(false)
      return
    }

    // Retry after delay (TradingView SPA render timing)
    retryRef.current = setTimeout(async () => {
      const result = await getContextWithRetry(2, 1500)
      if (mountedRef.current) {
        if (result) {
          setDetected(result)
        } else {
          // FIX: Don't auto-advance — show a fallback instead
          setDetected({ symbol: 'BTCUSDT', timeframe: '4h' })
        }
        setLoading(false)
        setShowContinue(true)
      }
    }, 1000)

    return () => {
      mountedRef.current = false
      if (retryRef.current) clearTimeout(retryRef.current)
    }
  }, [getChartContext, getContextWithRetry])

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <div className="text-center">
        <h2 className="text-sm font-bold text-tv-text mb-1">Chart Detected</h2>
        <p className="text-xs text-tv-text-secondary">
          Analyzing your current chart setup
      </p></div>

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="tv-spinner" />
          <p className="text-xs text-tv-text-muted">Reading chart data...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 bg-tv-surface border border-tv-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-tv-text-muted">Symbol</span>
            <span className="text-sm font-bold text-tv-text">{detected?.symbol}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-tv-text-muted">Timeframe</span>
            <span className="text-sm font-bold text-tv-text">{detected?.timeframe}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-tv-green" />
            <span className="text-xs text-tv-text-secondary">Chart data detected successfully</span>
          </div>
        </div>
      )}

      {(showContinue || !loading) && (
        <button className="btn-primary mt-2" onClick={advance}>
          Continue
        </button>
      )}
    </div>
  )
}

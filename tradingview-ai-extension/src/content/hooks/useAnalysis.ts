import { useCallback } from 'react'
import { useStore } from '../store/index.js'
import { useTradingView } from './useTradingView.js'

/**
 * Orchestrates the full analysis flow: read chart context → send to service worker → handle result.
 */
export function useAnalysis() {
  const { triggerAnalysis, retryAnalysis, isAnalyzing, lastError, lastAnalysis, usageRemaining } =
    useStore()
  const { getChartContext, getContextWithRetry } = useTradingView()

  const runAnalysis = useCallback(async () => {
    let ctx = getChartContext()

    // Retry if not found (TradingView SPA may not have rendered yet)
    if (!ctx) {
      ctx = await getContextWithRetry(3, 1500)
    }

    if (!ctx) {
      useStore.setState({
        lastError: 'Could not detect chart symbol. Make sure TradingView chart is loaded.',
        analysisErrorType: 'context_error',
      })
      return
    }

    await triggerAnalysis(ctx.symbol, ctx.timeframe, ctx.currentPrice)
  }, [getChartContext, getContextWithRetry, triggerAnalysis])

  return {
    runAnalysis,
    retryAnalysis,
    isAnalyzing,
    lastError,
    lastAnalysis,
    usageRemaining,
  }
}

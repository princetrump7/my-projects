import { useCallback, useRef } from 'react'
import type { ChartContext } from '../../shared/types.js'

/**
 * Extracts chart context from TradingView's DOM.
 * Uses multiple selector fallbacks for resilience.
 */
export function useTradingView() {
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const getChartContext = useCallback((): ChartContext | null => {
    try {
      const symbol = (
        document.querySelector('.tv-symbol-price-quote__symbol')?.textContent
        || document.querySelector('[data-symbol]')?.getAttribute('data-symbol')
        || document.querySelector('.ticker-symbol')?.textContent
        || document.querySelector('.chart-symbol-last')?.textContent
        || ''
      ).trim()

      const timeframeEl = document.querySelector(
        '.tv-button-timeframe.is-active, [data-timeframe].is-active, .timeframe-button.is-active'
      )
      const timeframe = timeframeEl?.textContent?.trim() || '1h'

      const priceEl = document.querySelector(
        '.tv-symbol-price-quote__value, .last-price, .quote-price'
      )
      const priceText = priceEl?.textContent?.replace(/[^0-9.]/g, '') || ''
      const price = priceText ? parseFloat(priceText) : null

      if (!symbol) return null

      return { symbol, timeframe, currentPrice: price, market: null }
    } catch {
      return null
    }
  }, [])

  /**
   * Retry getting context with a delay (TradingView is an SPA — DOM may not be ready).
   */
  const getContextWithRetry = useCallback(
    (retries = 3, delay = 1500): Promise<ChartContext | null> => {
      return new Promise((resolve) => {
        const attempt = (remaining: number) => {
          const ctx = getChartContext()
          if (ctx) {
            resolve(ctx)
            return
          }
          if (remaining <= 0) {
            resolve(null)
            return
          }
          retryRef.current = setTimeout(() => attempt(remaining - 1), delay)
        }
        attempt(retries)
      })
    },
    [getChartContext],
  )

  return { getChartContext, getContextWithRetry }
}

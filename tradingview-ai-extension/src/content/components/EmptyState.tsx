import React from 'react'

/**
 * Shown when the user navigates to a new chart (SPA navigation).
 * Prompts them to analyze the new chart.
 */
export const EmptyState: React.FC<{ onAnalyze: () => void }> = ({ onAnalyze }) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 gap-3">
      <div className="w-12 h-12 rounded-full bg-tv-surface flex items-center justify-center text-2xl">
        📊
      </div>
      <p className="text-tv-text text-sm text-center">
        New chart detected. Ready to analyze?
      </p>
      <button className="btn-primary mt-2" onClick={onAnalyze}>
        Analyze Chart
      </button>
    </div>
  )
}

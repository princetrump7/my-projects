import React from 'react'

interface Props {
  size?: number
  label?: string
  steps?: string[]
  currentStep?: number
}

/**
 * Animated spinner with optional progress steps.
 */
export const LoadingSpinner: React.FC<Props> = ({ size = 28, label = 'Analyzing chart...', steps, currentStep = 0 }) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 gap-4">
      <div
        className="tv-spinner"
        style={{ width: size, height: size }}
      />

      <p className="text-tv-text text-sm text-center">{label}</p>

      {steps && steps.length > 0 && (
        <div className="flex flex-col gap-2 w-full max-w-[240px]">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 text-xs transition-colors ${
                i <= currentStep ? 'text-tv-blue' : 'text-tv-text-muted'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                i < currentStep
                  ? 'bg-tv-blue text-white'
                  : i === currentStep
                    ? 'border-2 border-tv-blue'
                    : 'border border-tv-border'
              }`}>
                {i < currentStep ? '✓' : i + 1}
              </span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

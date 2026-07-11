import React from 'react'

interface Props {
  message: string
  onRetry?: () => void
  retryLabel?: string
}

/**
 * Error display with optional retry button.
 * Covers: quota errors, capture errors, context errors, analysis errors.
 */
export const ErrorState: React.FC<Props> = ({ message, onRetry, retryLabel = 'Try Again' }) => {
  const isQuota = message.toLowerCase().includes('limit') || message.toLowerCase().includes('quota')
  const isCapture = message.toLowerCase().includes('screenshot') || message.toLowerCase().includes('capture')

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 gap-3">
      {/* Icon */}
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
        isQuota
          ? 'bg-tv-yellow/10 text-tv-yellow'
          : isCapture
            ? 'bg-tv-surface-2 text-tv-text-secondary'
            : 'bg-tv-red/10 text-tv-red'
      }`}>
        {isQuota ? '⏰' : isCapture ? '📷' : '⚠️'}
      </div>

      <p className="text-tv-text text-sm text-center max-w-[280px]">{message}</p>

      {isQuota ? (
        <button
          className="btn-primary mt-2"
          onClick={() => {
            // Emit a custom event that the parent listens for to show pricing
            window.dispatchEvent(new CustomEvent('tvai-show-pricing'))
          }}
        >
          Upgrade Plan
        </button>
      ) : onRetry ? (
        <button className="btn-secondary mt-2" onClick={onRetry}>
          {retryLabel}
        </button>
      ) : null}
    </div>
  )
}

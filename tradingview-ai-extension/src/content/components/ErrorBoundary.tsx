import React from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * React error boundary for graceful failure recovery.
 * Catches render errors and shows a fallback UI instead of crashing the panel.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center gap-3 p-4">
          <div className="w-10 h-10 rounded-full bg-tv-red/10 flex items-center justify-center text-lg">
            ⚠️
          </div>
          <p className="text-tv-text text-xs text-center">
            Something went wrong. The panel needs to reload.
          </p>
          <button
            className="btn-secondary text-xs"
            onClick={this.handleReset}
          >
            Reload
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

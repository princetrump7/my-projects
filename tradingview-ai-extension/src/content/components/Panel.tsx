import React, { useEffect, useRef } from 'react'
import { useStore } from '../store/index.js'
import { PanelHeader } from './PanelHeader.js'
import { OnboardingFlow } from './OnboardingFlow.js'
import { AnalysisDisplay } from './AnalysisDisplay.js'

/**
 * Slide-in panel component.
 * Shows onboarding flow (if not completed) or analysis view.
 * Keyboard: Escape to close, Tab trapping for a11y.
 */
export const Panel: React.FC = () => {
  const panelOpen = useStore((s) => s.panelOpen)
  const setPanelOpen = useStore((s) => s.setPanelOpen)
  const onboardingComplete = useStore((s) => s.onboardingComplete)
  const panelRef = useRef<HTMLDivElement>(null)

  // Keyboard handler: Escape to close, Tab trapping
  useEffect(() => {
    if (!panelOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPanelOpen(false)
        return
      }

      // Tab trapping
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    // Focus first focusable element
    setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>('button, [href], input')
      first?.focus()
    }, 100)

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [panelOpen, setPanelOpen])

  // Slide animation class
  const animClass = panelOpen
    ? 'translate-x-0'
    : 'translate-x-full'

  return (
    <>
      {/* Backdrop */}
      {panelOpen && (
        <div
          className="fixed inset-0 z-[99998] bg-black/20"
          onClick={() => setPanelOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <div
        ref={panelRef}
        id="tvai-root"
        role="dialog"
        aria-modal="true"
        aria-label="AI Trading Assistant"
        className={`
          fixed top-0 right-0 h-full z-[99999]
          w-[var(--panel-width,380px)]
          bg-tv-bg border-l border-tv-border
          shadow-2xl
          flex flex-col
          transition-transform duration-200 ease-out
          ${animClass}
        `}
        style={{ maxWidth: '100vw' }}
      >
        <PanelHeader />

        <div className="flex-1 overflow-y-auto" id="tvai-body">
          {onboardingComplete ? <AnalysisDisplay /> : <OnboardingFlow />}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-tv-border shrink-0">
          <p className="text-[10px] text-tv-text-muted text-center">
            AI Copilot v2.0 • Powered by Groq
          </p>
        </div>
      </div>
    </>
  )
}

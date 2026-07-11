import React from 'react'
import { useOnboarding } from '../hooks/useOnboarding.js'
import { OnboardingStep } from '../../shared/types.js'
import { WelcomeStep } from './WelcomeStep.js'
import { MarketSelectStep } from './MarketSelectStep.js'
import { ChartDetectStep } from './ChartDetectStep.js'
import { AnalysisResultStep } from './AnalysisResultStep.js'
import { ValueDeepenStep } from './ValueDeepenStep.js'
import { SecondLoopStep } from './SecondLoopStep.js'
import { SoftPaywallStep } from './SoftPaywallStep.js'
import { PricingCards } from './PricingCards.js'

/**
 * 8-step onboarding flow orchestrator.
 * Renders the current step component with progress indicator.
 */
export const OnboardingFlow: React.FC = () => {
  const { currentStep, currentIndex, totalSteps, progress } = useOnboarding()

  const renderStep = () => {
    switch (currentStep) {
      case OnboardingStep.WELCOME:
        return <WelcomeStep />
      case OnboardingStep.MARKET_SELECT:
        return <MarketSelectStep />
      case OnboardingStep.CHART_DETECT:
        return <ChartDetectStep />
      case OnboardingStep.FIRST_RESULT:
        return <AnalysisResultStep />
      case OnboardingStep.VALUE_DEEPEN:
        return <ValueDeepenStep />
      case OnboardingStep.SECOND_LOOP:
        return <SecondLoopStep />
      case OnboardingStep.SOFT_PAYWALL:
        return <SoftPaywallStep />
      case OnboardingStep.PRICING:
        return <PricingCards />
      default:
        return <WelcomeStep />
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Progress bar */}
      <div className="h-1 bg-tv-surface-2 shrink-0">
        <div
          className="h-full bg-tv-blue transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto">
        {renderStep()}
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-1.5 px-4 py-3 border-t border-tv-border shrink-0">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
              i <= currentIndex ? 'bg-tv-blue' : 'bg-tv-border'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

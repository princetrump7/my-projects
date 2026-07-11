import { useCallback } from 'react'
import { useStore } from '../store/index.js'
import { OnboardingStep, ONBOARDING_STEPS } from '../../shared/types.js'

/**
 * Onboarding state machine: manages step advancement, skip, and reset.
 */
export function useOnboarding() {
  const onboardingStep = useStore((s) => s.onboardingStep)
  const onboardingComplete = useStore((s) => s.onboardingComplete)
  const nextOnboardingStep = useStore((s) => s.nextOnboardingStep)
  const skipOnboarding = useStore((s) => s.skipOnboarding)
  const setOnboardingStep = useStore((s) => s.setOnboardingStep)

  const currentIndex = ONBOARDING_STEPS.indexOf(onboardingStep)
  const totalSteps = ONBOARDING_STEPS.length
  const isLastStep = currentIndex === totalSteps - 1
  const progress = ((currentIndex + 1) / totalSteps) * 100

  const advance = useCallback(() => {
    nextOnboardingStep()
  }, [nextOnboardingStep])

  const skip = useCallback(async (tier?: 'free' | 'starter' | 'pro' | 'elite') => {
    await skipOnboarding(tier)
  }, [skipOnboarding])

  const goTo = useCallback((step: OnboardingStep) => {
    setOnboardingStep(step)
  }, [setOnboardingStep])

  return {
    currentStep: onboardingStep,
    currentIndex,
    totalSteps,
    isLastStep,
    progress,
    isComplete: onboardingComplete,
    advance,
    skip,
    goTo,
  }
}

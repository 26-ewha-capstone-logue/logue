'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  ONBOARDING_LAST_STEP,
  type OnboardingStepKey,
} from '../_constants/onboardingOptions';

export type OnboardingSubmission = {
  domain: string;
  task: string;
  tools: string[];
};

export function useOnboardingFlow() {
  const [step, setStep] = useState<OnboardingStepKey>(1);
  const [domain, setDomain] = useState<string | null>(null);
  const [task, setTask] = useState<string | null>(null);
  const [tools, setTools] = useState<Set<string>>(new Set());

  const canGoNext =
    (step === 1 && domain !== null) ||
    (step === 2 && task !== null) ||
    (step === 3 && tools.size > 0);
  const isFirstStep = step === 1;
  const isLastStep = step === ONBOARDING_LAST_STEP;
  const submission = useMemo<OnboardingSubmission | null>(() => {
    if (domain === null || task === null || tools.size === 0) return null;

    return {
      domain,
      task,
      tools: Array.from(tools),
    };
  }, [domain, task, tools]);

  const goToPreviousStep = useCallback(() => {
    setStep((currentStep) =>
      currentStep === 1
        ? currentStep
        : ((currentStep - 1) as OnboardingStepKey),
    );
  }, []);
  const goToNextStep = useCallback(() => {
    if (!canGoNext) return;
    setStep((currentStep) =>
      currentStep === ONBOARDING_LAST_STEP
        ? currentStep
        : ((currentStep + 1) as OnboardingStepKey),
    );
  }, [canGoNext]);
  const toggleTool = useCallback((value: string) => {
    setTools((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }, []);

  return {
    canGoNext,
    domain,
    goToNextStep,
    goToPreviousStep,
    isFirstStep,
    isLastStep,
    setDomain,
    setTask,
    step,
    submission,
    task,
    toggleTool,
    tools,
  };
}

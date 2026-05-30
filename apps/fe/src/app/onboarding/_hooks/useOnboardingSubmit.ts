'use client';

import { useCallback, useRef, useState } from 'react';
import type { OnboardingSubmission } from './useOnboardingFlow';

type UseOnboardingSubmitOptions = {
  onComplete: () => Promise<void> | void;
};

async function saveOnboardingSubmission(submission: OnboardingSubmission) {
  void submission;
  // Persist onboarding answers here when the API endpoint is available.
}

export function useOnboardingSubmit({
  onComplete,
}: UseOnboardingSubmitOptions) {
  const isSubmittingRef = useRef(false);
  const [isPending, setIsPending] = useState(false);

  const submit = useCallback(
    async (submission: OnboardingSubmission) => {
      if (isSubmittingRef.current) return;

      isSubmittingRef.current = true;
      setIsPending(true);
      try {
        await saveOnboardingSubmission(submission);
        await onComplete();
      } finally {
        isSubmittingRef.current = false;
        setIsPending(false);
      }
    },
    [onComplete],
  );

  return {
    isPending,
    submit,
  };
}

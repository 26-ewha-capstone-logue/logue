'use client';

import { useMemo, useReducer } from 'react';

export type AnalysisChatFlowState = {
  canAutoStartInitialQuestion: boolean;
  criteriaSubmissionLocked: boolean;
  hasResolvedStartPayload: boolean;
  hasStartedInitialQuestion: boolean;
  questionSubmissionLocked: boolean;
};

export type AnalysisChatFlowAction =
  | { type: 'start-payload-loading' }
  | { type: 'start-payload-resolved'; canAutoStartInitialQuestion: boolean }
  | { type: 'initial-question-started' }
  | { type: 'auto-start-disabled' }
  | { type: 'question-submission-started' }
  | { type: 'question-submission-finished' }
  | { type: 'criteria-submission-started' }
  | { type: 'criteria-submission-finished' };

export type AnalysisChatFlowActions = {
  autoStartDisabled: () => void;
  criteriaSubmissionFinished: () => void;
  criteriaSubmissionStarted: () => void;
  initialQuestionStarted: () => void;
  questionSubmissionFinished: () => void;
  questionSubmissionStarted: () => void;
  startPayloadLoading: () => void;
  startPayloadResolved: (canAutoStartInitialQuestion: boolean) => void;
};

export const initialAnalysisChatFlowState: AnalysisChatFlowState = {
  canAutoStartInitialQuestion: false,
  criteriaSubmissionLocked: false,
  hasResolvedStartPayload: false,
  hasStartedInitialQuestion: false,
  questionSubmissionLocked: false,
};

export function analysisChatFlowReducer(
  state: AnalysisChatFlowState,
  action: AnalysisChatFlowAction,
): AnalysisChatFlowState {
  switch (action.type) {
    case 'start-payload-loading':
      return {
        ...state,
        canAutoStartInitialQuestion: false,
        hasResolvedStartPayload: false,
      };
    case 'start-payload-resolved':
      return {
        ...state,
        canAutoStartInitialQuestion: action.canAutoStartInitialQuestion,
        hasResolvedStartPayload: true,
      };
    case 'initial-question-started':
      return {
        ...state,
        canAutoStartInitialQuestion: false,
        hasStartedInitialQuestion: true,
      };
    case 'auto-start-disabled':
      return {
        ...state,
        canAutoStartInitialQuestion: false,
      };
    case 'question-submission-started':
      return {
        ...state,
        questionSubmissionLocked: true,
      };
    case 'question-submission-finished':
      return {
        ...state,
        questionSubmissionLocked: false,
      };
    case 'criteria-submission-started':
      return {
        ...state,
        criteriaSubmissionLocked: true,
      };
    case 'criteria-submission-finished':
      return {
        ...state,
        criteriaSubmissionLocked: false,
      };
  }
}

export function useAnalysisChatFlow() {
  const [flow, dispatchFlow] = useReducer(
    analysisChatFlowReducer,
    initialAnalysisChatFlowState,
  );
  const actions = useMemo<AnalysisChatFlowActions>(
    () => ({
      autoStartDisabled: () => {
        dispatchFlow({ type: 'auto-start-disabled' });
      },
      criteriaSubmissionFinished: () => {
        dispatchFlow({ type: 'criteria-submission-finished' });
      },
      criteriaSubmissionStarted: () => {
        dispatchFlow({ type: 'criteria-submission-started' });
      },
      initialQuestionStarted: () => {
        dispatchFlow({ type: 'initial-question-started' });
      },
      questionSubmissionFinished: () => {
        dispatchFlow({ type: 'question-submission-finished' });
      },
      questionSubmissionStarted: () => {
        dispatchFlow({ type: 'question-submission-started' });
      },
      startPayloadLoading: () => {
        dispatchFlow({ type: 'start-payload-loading' });
      },
      startPayloadResolved: (canAutoStartInitialQuestion) => {
        dispatchFlow({
          type: 'start-payload-resolved',
          canAutoStartInitialQuestion,
        });
      },
    }),
    [dispatchFlow],
  );

  return {
    actions,
    flow,
  };
}

'use client';

import { useMemo, useReducer } from 'react';
import {
  analysisWorkflowReducer,
  initialAnalysisWorkflowState,
  isCriteriaSubmissionLocked,
  isQuestionSubmissionLocked,
  type AnalysisWorkflowAction,
  type AnalysisWorkflowState,
  type AnalysisWorkflowStatus,
} from '../_models/analysisWorkflowState';

export type AnalysisChatFlowState = {
  canAutoStartInitialQuestion: boolean;
  criteriaSubmissionLocked: boolean;
  hasResolvedStartPayload: boolean;
  hasStartedInitialQuestion: boolean;
  questionSubmissionLocked: boolean;
  status: AnalysisWorkflowStatus;
};

export type AnalysisChatFlowAction = AnalysisWorkflowAction;

export type AnalysisChatFlowActions = {
  autoStartDisabled: () => void;
  criteriaSubmissionCanceled: () => void;
  criteriaSubmissionFailed: () => void;
  criteriaSubmissionStarted: () => void;
  criteriaSubmissionSucceeded: () => void;
  initialQuestionStarted: () => void;
  questionSubmissionCanceled: () => void;
  questionSubmissionFailed: () => void;
  questionSubmissionStarted: () => void;
  questionSubmissionSucceeded: () => void;
  startPayloadLoading: () => void;
  startPayloadResolved: (canAutoStartInitialQuestion: boolean) => void;
  summaryCanceled: () => void;
  summaryFailed: () => void;
  summaryPending: () => void;
  summaryReady: () => void;
};

function toChatFlowState(state: AnalysisWorkflowState): AnalysisChatFlowState {
  return {
    ...state,
    criteriaSubmissionLocked: isCriteriaSubmissionLocked(state),
    questionSubmissionLocked: isQuestionSubmissionLocked(state),
  };
}

export const initialAnalysisChatFlowState = toChatFlowState(
  initialAnalysisWorkflowState,
);

export function analysisChatFlowReducer(
  state: AnalysisChatFlowState,
  action: AnalysisChatFlowAction,
): AnalysisChatFlowState {
  return toChatFlowState(analysisWorkflowReducer(state, action));
}

export function useAnalysisChatFlow() {
  const [workflowState, dispatchFlow] = useReducer(
    analysisWorkflowReducer,
    initialAnalysisWorkflowState,
  );
  const actions = useMemo<AnalysisChatFlowActions>(
    () => ({
      autoStartDisabled: () => {
        dispatchFlow({ type: 'auto-start-disabled' });
      },
      criteriaSubmissionCanceled: () => {
        dispatchFlow({ type: 'criteria-submission-canceled' });
      },
      criteriaSubmissionFailed: () => {
        dispatchFlow({ type: 'criteria-submission-failed' });
      },
      criteriaSubmissionStarted: () => {
        dispatchFlow({ type: 'criteria-submission-started' });
      },
      criteriaSubmissionSucceeded: () => {
        dispatchFlow({ type: 'criteria-submission-succeeded' });
      },
      initialQuestionStarted: () => {
        dispatchFlow({ type: 'initial-question-started' });
      },
      questionSubmissionCanceled: () => {
        dispatchFlow({ type: 'question-submission-canceled' });
      },
      questionSubmissionFailed: () => {
        dispatchFlow({ type: 'question-submission-failed' });
      },
      questionSubmissionStarted: () => {
        dispatchFlow({ type: 'question-submission-started' });
      },
      questionSubmissionSucceeded: () => {
        dispatchFlow({ type: 'question-submission-succeeded' });
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
      summaryCanceled: () => {
        dispatchFlow({ type: 'summary-canceled' });
      },
      summaryFailed: () => {
        dispatchFlow({ type: 'summary-failed' });
      },
      summaryPending: () => {
        dispatchFlow({ type: 'summary-pending' });
      },
      summaryReady: () => {
        dispatchFlow({ type: 'summary-ready' });
      },
    }),
    [dispatchFlow],
  );
  const flow = useMemo(() => toChatFlowState(workflowState), [workflowState]);

  return {
    actions,
    flow,
  };
}

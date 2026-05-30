'use client';

import { useCallback, useMemo, type Dispatch } from 'react';
import type {
  CriteriaViewModel,
  QuestionResultViewModel,
} from '../_models/analysisViewModels';
import type { AnalysisChatFlowAction } from './useAnalysisChatFlow';
import type { CriteriaInitialMode } from './useAnalysisChatMessages';

type UseAnalysisWorkflowEffectsParams = {
  appendCriteriaMessage: (
    criteria: CriteriaViewModel,
    initialMode?: CriteriaInitialMode,
  ) => void;
  appendNotice: (content: string, tone?: 'default' | 'error') => void;
  appendResultMessage: (result: QuestionResultViewModel) => void;
  appendUserQuestion: (content: string) => void;
  dispatchFlow: Dispatch<AnalysisChatFlowAction>;
  showToast: (message: string) => void;
};

export function useAnalysisWorkflowEffects({
  appendCriteriaMessage,
  appendNotice,
  appendResultMessage,
  appendUserQuestion,
  dispatchFlow,
  showToast,
}: UseAnalysisWorkflowEffectsParams) {
  const dispatchCriteriaSubmissionFinished = useCallback(() => {
    dispatchFlow({ type: 'criteria-submission-finished' });
  }, [dispatchFlow]);
  const dispatchCriteriaSubmissionStarted = useCallback(() => {
    dispatchFlow({ type: 'criteria-submission-started' });
  }, [dispatchFlow]);
  const dispatchInitialQuestionStarted = useCallback(() => {
    dispatchFlow({ type: 'initial-question-started' });
  }, [dispatchFlow]);
  const dispatchQuestionSubmissionFinished = useCallback(() => {
    dispatchFlow({ type: 'question-submission-finished' });
  }, [dispatchFlow]);
  const dispatchQuestionSubmissionStarted = useCallback(() => {
    dispatchFlow({ type: 'question-submission-started' });
  }, [dispatchFlow]);

  return useMemo(
    () => ({
      dispatch: {
        criteriaSubmissionFinished: dispatchCriteriaSubmissionFinished,
        criteriaSubmissionStarted: dispatchCriteriaSubmissionStarted,
        initialQuestionStarted: dispatchInitialQuestionStarted,
        questionSubmissionFinished: dispatchQuestionSubmissionFinished,
        questionSubmissionStarted: dispatchQuestionSubmissionStarted,
      },
      messages: {
        appendCriteriaMessage,
        appendNotice,
        appendResultMessage,
        appendUserQuestion,
      },
      notify: {
        showToast,
      },
    }),
    [
      appendCriteriaMessage,
      appendNotice,
      appendResultMessage,
      appendUserQuestion,
      dispatchCriteriaSubmissionFinished,
      dispatchCriteriaSubmissionStarted,
      dispatchInitialQuestionStarted,
      dispatchQuestionSubmissionFinished,
      dispatchQuestionSubmissionStarted,
      showToast,
    ],
  );
}

export type AnalysisWorkflowEffects = ReturnType<
  typeof useAnalysisWorkflowEffects
>;

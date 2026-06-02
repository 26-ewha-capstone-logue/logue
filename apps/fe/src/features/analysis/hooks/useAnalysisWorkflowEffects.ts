'use client';

import { useMemo } from 'react';
import type {
  CriteriaViewModel,
  QuestionResultViewModel,
} from '@/features/analysis/models/analysisViewModels';
import type { AnalysisChatFlowActions } from './useAnalysisChatFlow';
import type { CriteriaInitialMode } from './useAnalysisChatMessages';

type AnalysisWorkflowDispatchActions = Pick<
  AnalysisChatFlowActions,
  | 'criteriaSubmissionCanceled'
  | 'criteriaSubmissionFailed'
  | 'criteriaSubmissionStarted'
  | 'criteriaSubmissionSucceeded'
  | 'initialQuestionStarted'
  | 'questionSubmissionCanceled'
  | 'questionSubmissionFailed'
  | 'questionSubmissionStarted'
  | 'questionSubmissionSucceeded'
  | 'summaryCanceled'
  | 'summaryFailed'
>;

type UseAnalysisWorkflowEffectsParams = {
  appendCriteriaMessage: (
    criteria: CriteriaViewModel,
    initialMode?: CriteriaInitialMode,
  ) => void;
  appendNotice: (content: string, tone?: 'default' | 'error') => void;
  appendResultMessage: (result: QuestionResultViewModel) => void;
  appendUserQuestion: (content: string) => void;
  flowActions: AnalysisWorkflowDispatchActions;
  showToast: (message: string) => void;
};

export function useAnalysisWorkflowEffects({
  appendCriteriaMessage,
  appendNotice,
  appendResultMessage,
  appendUserQuestion,
  flowActions,
  showToast,
}: UseAnalysisWorkflowEffectsParams) {
  return useMemo(
    () => ({
      dispatch: flowActions,
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
      flowActions,
      showToast,
    ],
  );
}

export type AnalysisWorkflowEffects = ReturnType<
  typeof useAnalysisWorkflowEffects
>;

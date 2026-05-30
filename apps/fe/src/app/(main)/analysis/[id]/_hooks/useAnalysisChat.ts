'use client';

import { useCallback, useReducer } from 'react';
import { useToast } from '@/hooks/useToast';
import { ANALYSIS_DEFAULT_PROMPT } from '../_config/analysisWorkflowMessages';
import { uniqueStrings } from '../_utils/stringList';
import { useAnalysisChatMessages } from './useAnalysisChatMessages';
import { useAnalysisChatViewModel } from './useAnalysisChatViewModel';
import {
  analysisChatFlowReducer,
  initialAnalysisChatFlowState,
} from './useAnalysisChatFlow';
import { useAnalysisChatSideEffects } from './useAnalysisChatSideEffects';
import { useAnalysisPageData } from './useAnalysisPageData';
import { useAnalysisWorkflowController } from './useAnalysisWorkflowController';

export type {
  ChatMessage,
  CriteriaInitialMode,
} from './useAnalysisChatMessages';

type UseAnalysisChatParams = {
  hasAccessToken: boolean;
  routeConversationId: string;
};

export function useAnalysisChat({
  hasAccessToken,
  routeConversationId,
}: UseAnalysisChatParams) {
  const { toast, showToast } = useToast();
  const [flow, dispatchFlow] = useReducer(
    analysisChatFlowReducer,
    initialAnalysisChatFlowState,
  );
  const {
    appendCriteriaMessage,
    appendNotice,
    appendResultMessage,
    appendUserQuestion,
    initialMessage,
    restMessages,
    updateInitialMessage,
  } = useAnalysisChatMessages(ANALYSIS_DEFAULT_PROMPT);
  const {
    analysisFlowId,
    conversationId,
    dataSourceErrorMessage,
    fileName,
    initialPrompt,
    isDataSourceEmpty,
    isDataSourceLoading,
    previewTable,
    summary,
    summaryErrorMessage,
    summaryPending,
  } = useAnalysisPageData({
    defaultPrompt: ANALYSIS_DEFAULT_PROMPT,
    dispatchFlow,
    hasAccessToken,
    routeConversationId,
  });
  const {
    canAutoStartInitialQuestion,
    criteriaSubmissionLocked,
    hasResolvedStartPayload,
    hasStartedInitialQuestion,
    questionSubmissionLocked,
  } = flow;
  const dispatchCriteriaSubmissionFinished = useCallback(() => {
    dispatchFlow({ type: 'criteria-submission-finished' });
  }, []);
  const dispatchCriteriaSubmissionStarted = useCallback(() => {
    dispatchFlow({ type: 'criteria-submission-started' });
  }, []);
  const dispatchInitialQuestionStarted = useCallback(() => {
    dispatchFlow({ type: 'initial-question-started' });
  }, []);
  const dispatchQuestionSubmissionFinished = useCallback(() => {
    dispatchFlow({ type: 'question-submission-finished' });
  }, []);
  const dispatchQuestionSubmissionStarted = useCallback(() => {
    dispatchFlow({ type: 'question-submission-started' });
  }, []);
  const workflow = useAnalysisWorkflowController({
    analysisFlowId,
    appendCriteriaMessage,
    appendNotice,
    appendResultMessage,
    appendUserQuestion,
    canAutoStartInitialQuestion,
    conversationId,
    criteriaSubmissionLocked,
    dispatchCriteriaSubmissionFinished,
    dispatchCriteriaSubmissionStarted,
    dispatchInitialQuestionStarted,
    dispatchQuestionSubmissionFinished,
    dispatchQuestionSubmissionStarted,
    hasResolvedStartPayload,
    hasStartedInitialQuestion,
    questionSubmissionLocked,
    showToast,
    summary,
    summaryPending,
  });
  const { startQuestion } = workflow;
  const { startInitialQuestion } = useAnalysisChatSideEffects({
    canAutoStartInitialQuestion,
    conversationId,
    dispatchInitialQuestionStarted,
    fileName,
    hasAccessToken,
    hasResolvedStartPayload,
    hasStartedInitialQuestion,
    initialPrompt,
    startQuestion,
    summary,
    updateInitialMessage,
  });

  const summaryColumnOptions = summary?.columnOptions ?? [];
  const summarySortOptions = uniqueStrings([
    ...(summary?.measureOptions ?? []),
    ...summaryColumnOptions,
  ]);
  const summaryErrorMessageForView = workflow.hasCanceledCurrentSummary
    ? null
    : summaryErrorMessage;
  const messageList = useAnalysisChatViewModel({
    analyzingMessage: workflow.analyzingMessage,
    canCancelAnalyzing: workflow.canCancelAnalyzing,
    cancelAnalyzingDisabled: workflow.cancelAnalyzingDisabled,
    criteriaSubmitting: workflow.criteriaSubmitting,
    handleCancelAnalyzing: workflow.handleCancelAnalyzing,
    handleConfirmCriteria: workflow.handleConfirmCriteria,
    initialMessage,
    restMessages,
    shouldShowAnalyzing: workflow.shouldShowAnalyzing,
    startInitialQuestion,
    summary,
    summaryActionDisabled: workflow.summaryActionDisabled,
    summaryColumnOptions,
    summaryErrorMessage: summaryErrorMessageForView,
    summarySortOptions,
  });

  return {
    dataPreview: {
      errorMessage: dataSourceErrorMessage,
      isEmpty: isDataSourceEmpty,
      isLoading: isDataSourceLoading,
      table: previewTable,
    },
    input: {
      disabled: workflow.inputDisabled,
      onSubmit: workflow.handleSubmit,
    },
    messageList,
    toast,
  };
}

export type UseAnalysisChatResult = ReturnType<typeof useAnalysisChat>;

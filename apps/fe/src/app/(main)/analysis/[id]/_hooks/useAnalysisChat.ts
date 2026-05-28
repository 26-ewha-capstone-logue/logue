'use client';

import { useCallback, useEffect, useReducer } from 'react';
import { useToast } from '@/hooks/useToast';
import { markAnalysisStartPayloadConsumed } from '@/lib/analysisStartPayload';
import { ANALYSIS_DEFAULT_PROMPT } from '../_config/analysisWorkflowMessages';
import { uniqueStrings } from '../_utils/stringList';
import {
  useAnalysisChatMessages,
  type CriteriaInitialMode,
} from './useAnalysisChatMessages';
import { useAnalysisChatViewModel } from './useAnalysisChatViewModel';
import {
  analysisChatFlowReducer,
  initialAnalysisChatFlowState,
} from './useAnalysisChatFlow';
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

  const startInitialQuestion = useCallback(
    (initialMode: CriteriaInitialMode = 'normal') => {
      if (
        !hasAccessToken ||
        hasStartedInitialQuestion ||
        !hasResolvedStartPayload ||
        !canAutoStartInitialQuestion ||
        conversationId === null
      ) {
        return;
      }

      markAnalysisStartPayloadConsumed(conversationId);
      dispatchInitialQuestionStarted();
      startQuestion(initialPrompt, false, initialMode);
    },
    [
      canAutoStartInitialQuestion,
      conversationId,
      hasAccessToken,
      hasResolvedStartPayload,
      hasStartedInitialQuestion,
      initialPrompt,
      dispatchInitialQuestionStarted,
      startQuestion,
    ],
  );

  useEffect(() => {
    if (!hasResolvedStartPayload) return;

    const timer = window.setTimeout(() => {
      updateInitialMessage(initialPrompt, fileName);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fileName, hasResolvedStartPayload, initialPrompt, updateInitialMessage]);

  useEffect(() => {
    if (
      !hasAccessToken ||
      !summary ||
      hasStartedInitialQuestion ||
      !hasResolvedStartPayload ||
      !canAutoStartInitialQuestion
    ) {
      return;
    }
    if (summary.warnings.length > 0) return;

    const timer = window.setTimeout(() => {
      startInitialQuestion();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [
    canAutoStartInitialQuestion,
    hasAccessToken,
    hasResolvedStartPayload,
    hasStartedInitialQuestion,
    startInitialQuestion,
    summary,
  ]);

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
    handleSubmit: workflow.handleSubmit,
    inputDisabled: workflow.inputDisabled,
    dataSourceErrorMessage,
    isDataSourceLoading,
    isDataSourceEmpty,
    messageList,
    previewTable,
    toast,
  };
}

export type UseAnalysisChatResult = ReturnType<typeof useAnalysisChat>;

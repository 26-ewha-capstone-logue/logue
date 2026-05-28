'use client';

import { useCallback, useEffect, useReducer } from 'react';
import { useToast } from '@/hooks/useToast';
import { markAnalysisStartPayloadConsumed } from '@/lib/analysisStartPayload';
import { uniqueStrings } from '../_utils/stringList';
import { useAnalysisDataPreview } from './useAnalysisDataPreview';
import {
  useAnalysisChatMessages,
  type CriteriaInitialMode,
} from './useAnalysisChatMessages';
import { useAnalysisChatViewModel } from './useAnalysisChatViewModel';
import {
  analysisChatFlowReducer,
  initialAnalysisChatFlowState,
} from './useAnalysisChatFlow';
import { useAnalysisRouteParams } from './useAnalysisRouteParams';
import { useAnalysisStartPayload } from './useAnalysisStartPayload';
import { useAnalysisWorkflowController } from './useAnalysisWorkflowController';
import { useSummaryPhase } from './useSummaryPhase';

export type {
  ChatMessage,
  CriteriaInitialMode,
} from './useAnalysisChatMessages';

const DEFAULT_PROMPT = 'CSV 파일을 분석해 주세요';
const STATUS_POLL_INTERVAL_MS = 1500;
const INVALID_ROUTE_MESSAGE = '분석 정보를 찾지 못했어요. 다시 시작해 주세요.';
const GET_SUMMARY_ERROR_MESSAGE =
  'CSV 데이터 요약을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
const GET_DATA_SOURCE_ERROR_MESSAGE =
  'CSV 미리보기를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';

type UseAnalysisChatParams = {
  hasAccessToken: boolean;
  routeConversationId: string;
};

export function useAnalysisChat({
  hasAccessToken,
  routeConversationId,
}: UseAnalysisChatParams) {
  const { analysisFlowId, conversationId, dataSourceId, routeReady } =
    useAnalysisRouteParams(routeConversationId);
  const { toast, showToast } = useToast();
  const [flow, dispatchFlow] = useReducer(
    analysisChatFlowReducer,
    initialAnalysisChatFlowState,
  );
  const { fileName, initialPrompt } = useAnalysisStartPayload({
    conversationId,
    defaultPrompt: DEFAULT_PROMPT,
    dispatchFlow,
  });
  const {
    appendCriteriaMessage,
    appendNotice,
    appendResultMessage,
    appendUserQuestion,
    initialMessage,
    restMessages,
    updateInitialMessage,
  } = useAnalysisChatMessages(DEFAULT_PROMPT);
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

  const { summary, summaryErrorMessage, summaryPending } = useSummaryPhase({
    analysisFlowId,
    conversationId,
    failedSummaryMessage:
      'CSV 데이터 요약에 실패했어요. 파일을 확인하고 다시 시도해 주세요.',
    getSummaryErrorMessage: GET_SUMMARY_ERROR_MESSAGE,
    invalidRouteMessage: INVALID_ROUTE_MESSAGE,
    routeReady: hasAccessToken && routeReady,
    statusPollIntervalMs: STATUS_POLL_INTERVAL_MS,
  });
  const {
    dataSourceErrorMessage,
    isDataSourceEmpty,
    isDataSourceLoading,
    previewTable,
  } = useAnalysisDataPreview({
    dataSourceId,
    enabled: hasAccessToken,
    errorMessage: GET_DATA_SOURCE_ERROR_MESSAGE,
    invalidRouteMessage: INVALID_ROUTE_MESSAGE,
  });
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

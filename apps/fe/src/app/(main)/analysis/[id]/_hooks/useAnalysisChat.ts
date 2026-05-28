'use client';

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  analysisQueryKeys,
  cancelCriteria,
  cancelResult,
  cancelSummary,
  type AnalysisStatusResponse,
  type QuestionResultParams,
} from '@/apis/analysis';
import { useToast } from '@/hooks/useToast';
import { markAnalysisStartPayloadConsumed } from '@/lib/analysisStartPayload';
import type { PromptInputValue } from '../../_components/PromptInput';
import { getAnalysisErrorMessage } from '../_adapters/normalizeAnalysisError';
import { createUpdateCriteriaRequest } from '../_adapters/normalizeCriteria';
import type { CriteriaEditValues } from '../_models/analysisViewModels';
import {
  getAnalysisCancelTarget,
  getResultCancelKey,
  type AnalysisCancelTarget,
  type PendingCriteriaCancelTarget,
} from '../_utils/analysisCancelTarget';
import { uniqueStrings } from '../_utils/stringList';
import { useAnalysisDataPreview } from './useAnalysisDataPreview';
import {
  useAnalysisChatMessages,
  type CriteriaInitialMode,
} from './useAnalysisChatMessages';
import {
  analysisChatFlowReducer,
  initialAnalysisChatFlowState,
} from './useAnalysisChatFlow';
import { useAnalysisRouteParams } from './useAnalysisRouteParams';
import { useAnalysisStartPayload } from './useAnalysisStartPayload';
import { useCriteriaPhase } from './useCriteriaPhase';
import { useResultPhase } from './useResultPhase';
import { useSummaryPhase } from './useSummaryPhase';

export type {
  ChatMessage,
  CriteriaInitialMode,
} from './useAnalysisChatMessages';

const DEFAULT_PROMPT = 'CSV 파일을 분석해 주세요';
const STATUS_POLL_INTERVAL_MS = 1500;
const QUESTION_ANALYSIS_TIMEOUT_MS = 120000;
const RESULT_ANALYSIS_TIMEOUT_MS = 120000;
const INVALID_ROUTE_MESSAGE = '분석 정보를 찾지 못했어요. 다시 시작해 주세요.';
const SUMMARY_NOT_READY_MESSAGE = 'CSV 데이터 요약이 끝난 뒤 질문할 수 있어요.';
const GET_SUMMARY_ERROR_MESSAGE =
  'CSV 데이터 요약을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
const CREATE_QUESTION_ERROR_MESSAGE =
  '질문 분석을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.';
const GET_CRITERIA_ERROR_MESSAGE =
  '분석 기준을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
const UPDATE_CRITERIA_ERROR_MESSAGE =
  '분석 기준을 확정하지 못했어요. 잠시 후 다시 시도해 주세요.';
const GET_RESULT_ERROR_MESSAGE =
  '최종 분석 결과를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';

const GET_DATA_SOURCE_ERROR_MESSAGE =
  'CSV 미리보기를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
const CANCEL_ANALYSIS_ERROR_MESSAGE =
  '분석을 취소하지 못했어요. 잠시 후 다시 시도해 주세요.';
const SUMMARY_CANCELED_MESSAGE = 'CSV 데이터 요약을 취소했어요.';
const CRITERIA_CANCELED_MESSAGE = '질문 분석을 취소했어요.';
const RESULT_CANCELED_MESSAGE = '최종 분석 결과 생성을 취소했어요.';

function getAnalysisFlowKey({
  analysisFlowId,
  conversationId,
}: {
  analysisFlowId: number;
  conversationId: number;
}) {
  return `${conversationId}:${analysisFlowId}`;
}

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
  const queryClient = useQueryClient();
  const operationSequenceRef = useRef(0);
  const canceledCriteriaOperationKeysRef = useRef(new Set<string>());
  const canceledResultKeysRef = useRef(new Set<string>());
  const [canceledSummaryKey, setCanceledSummaryKey] = useState<string | null>(
    null,
  );
  const [pendingCriteriaOperationKey, setPendingCriteriaOperationKey] =
    useState<string | null>(null);
  const [pendingCriteriaCancelTarget, setPendingCriteriaCancelTarget] =
    useState<PendingCriteriaCancelTarget | null>(null);
  const [pendingResultCancelParams, setPendingResultCancelParams] =
    useState<QuestionResultParams | null>(null);
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
  const createOperationKey = useCallback((stage: string) => {
    operationSequenceRef.current += 1;
    return `${stage}-${operationSequenceRef.current}`;
  }, []);
  const clearPendingCriteriaOperation = useCallback((operationKey: string) => {
    setPendingCriteriaOperationKey((current) =>
      current === operationKey ? null : current,
    );
    setPendingCriteriaCancelTarget((current) =>
      current?.operationKey === operationKey ? null : current,
    );
  }, []);
  const clearPendingResultCancelParams = useCallback(
    (
      params: Pick<QuestionResultParams, 'analysisCriteriaId' | 'messageId'>,
    ) => {
      const canceledKey = getResultCancelKey(params);

      setPendingResultCancelParams((current) =>
        current && getResultCancelKey(current) === canceledKey ? null : current,
      );
    },
    [],
  );

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
  const { questionAnalysisMutation, updateCriteriaMutation } = useCriteriaPhase(
    {
      getCriteriaErrorMessage: GET_CRITERIA_ERROR_MESSAGE,
      onQuestionCreated: setPendingCriteriaCancelTarget,
      questionAnalysisTimeoutMs: QUESTION_ANALYSIS_TIMEOUT_MS,
      statusPollIntervalMs: STATUS_POLL_INTERVAL_MS,
    },
  );
  const {
    mutate: mutateQuestionAnalysis,
    isPending: isQuestionAnalysisPending,
  } = questionAnalysisMutation;
  const resultAnalysisMutation = useResultPhase({
    getResultErrorMessage: GET_RESULT_ERROR_MESSAGE,
    resultAnalysisTimeoutMs: RESULT_ANALYSIS_TIMEOUT_MS,
    statusPollIntervalMs: STATUS_POLL_INTERVAL_MS,
  });
  const markCancelStatus = useCallback(
    (target: AnalysisCancelTarget) => {
      const canceledStatus = {
        status: 'CANCELED',
      } satisfies AnalysisStatusResponse;

      if (target.stage === 'summary') {
        queryClient.setQueryData(
          analysisQueryKeys.summaryStatus(
            target.params.conversationId,
            target.params.analysisFlowId,
          ),
          canceledStatus,
        );
        return;
      }

      if (target.stage === 'criteria') {
        queryClient.setQueryData(
          analysisQueryKeys.criteriaStatus(
            target.params.conversationId,
            target.params.analysisFlowId,
            target.params.messageId,
          ),
          canceledStatus,
        );
        return;
      }

      queryClient.setQueryData(
        analysisQueryKeys.resultStatus(
          target.params.conversationId,
          target.params.analysisFlowId,
          target.params.messageId,
          target.params.analysisCriteriaId,
        ),
        canceledStatus,
      );
    },
    [queryClient],
  );
  const cancelAnalysisMutation = useMutation({
    mutationFn: (target: AnalysisCancelTarget) => {
      if (target.stage === 'summary') {
        return cancelSummary(target.params);
      }

      if (target.stage === 'criteria') {
        return cancelCriteria(target.params);
      }

      return cancelResult(target.params);
    },
    onSuccess: (_response, target) => {
      markCancelStatus(target);

      if (target.stage === 'summary') {
        setCanceledSummaryKey(getAnalysisFlowKey(target.params));
        appendNotice(SUMMARY_CANCELED_MESSAGE);
        return;
      }

      if (target.stage === 'criteria') {
        canceledCriteriaOperationKeysRef.current.add(target.operationKey);
        clearPendingCriteriaOperation(target.operationKey);
        dispatchFlow({ type: 'question-submission-finished' });
        appendNotice(CRITERIA_CANCELED_MESSAGE);
        return;
      }

      canceledResultKeysRef.current.add(getResultCancelKey(target.params));
      clearPendingResultCancelParams(target.params);
      dispatchFlow({ type: 'criteria-submission-finished' });
      appendNotice(RESULT_CANCELED_MESSAGE);
    },
    onError: (error) => {
      const message = getAnalysisErrorMessage(
        error,
        CANCEL_ANALYSIS_ERROR_MESSAGE,
      );
      showToast(message);
      appendNotice(message, 'error');
    },
  });

  const startQuestion = useCallback(
    (
      question: string,
      appendUserMessage = true,
      initialMode: CriteriaInitialMode = 'normal',
    ) => {
      if (questionSubmissionLocked) return;

      if (conversationId === null || analysisFlowId === null) {
        showToast(INVALID_ROUTE_MESSAGE);
        appendNotice(INVALID_ROUTE_MESSAGE, 'error');
        return;
      }

      const normalizedQuestion = question.trim();
      if (!normalizedQuestion) return;

      const operationKey = createOperationKey('criteria');
      setPendingCriteriaOperationKey(operationKey);
      setPendingCriteriaCancelTarget(null);
      dispatchFlow({ type: 'question-submission-started' });

      if (appendUserMessage) {
        appendUserQuestion(normalizedQuestion);
      }

      mutateQuestionAnalysis(
        {
          operationKey,
          targetConversationId: conversationId,
          targetAnalysisFlowId: analysisFlowId,
          question: normalizedQuestion,
          initialMode,
        },
        {
          onSuccess: (criteria, variables) => {
            clearPendingCriteriaOperation(variables.operationKey);
            dispatchFlow({ type: 'question-submission-finished' });
            appendCriteriaMessage(criteria, variables.initialMode);
          },
          onError: (error, variables) => {
            clearPendingCriteriaOperation(variables.operationKey);
            if (
              canceledCriteriaOperationKeysRef.current.delete(
                variables.operationKey,
              )
            ) {
              return;
            }

            dispatchFlow({ type: 'question-submission-finished' });
            const message = getAnalysisErrorMessage(
              error,
              CREATE_QUESTION_ERROR_MESSAGE,
            );
            showToast(message);
            appendNotice(message, 'error');
          },
        },
      );
    },
    [
      analysisFlowId,
      appendCriteriaMessage,
      appendNotice,
      appendUserQuestion,
      clearPendingCriteriaOperation,
      conversationId,
      createOperationKey,
      dispatchFlow,
      mutateQuestionAnalysis,
      questionSubmissionLocked,
      showToast,
    ],
  );

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
      dispatchFlow({ type: 'initial-question-started' });
      startQuestion(initialPrompt, false, initialMode);
    },
    [
      canAutoStartInitialQuestion,
      conversationId,
      hasAccessToken,
      hasResolvedStartPayload,
      hasStartedInitialQuestion,
      initialPrompt,
      dispatchFlow,
      startQuestion,
    ],
  );

  const handleSubmit = useCallback(
    (value: PromptInputValue) => {
      if (!summary) {
        showToast(SUMMARY_NOT_READY_MESSAGE);
        return;
      }

      if (conversationId !== null) {
        markAnalysisStartPayloadConsumed(conversationId);
      }
      dispatchFlow({ type: 'initial-question-started' });
      startQuestion(value.prompt);
    },
    [conversationId, dispatchFlow, showToast, startQuestion, summary],
  );

  function handleConfirmCriteria(
    messageId: number,
    values: CriteriaEditValues,
  ) {
    if (criteriaSubmissionLocked) return;

    if (conversationId === null || analysisFlowId === null) {
      showToast(INVALID_ROUTE_MESSAGE);
      return;
    }

    dispatchFlow({ type: 'criteria-submission-started' });
    setPendingResultCancelParams(null);

    updateCriteriaMutation.mutate(
      {
        targetConversationId: conversationId,
        targetAnalysisFlowId: analysisFlowId,
        messageId,
        request: createUpdateCriteriaRequest(values),
      },
      {
        onSuccess: ({ analysisCriteriaId }) => {
          appendNotice('분석 기준이 확정되었어요.');
          const resultParams = {
            conversationId,
            analysisFlowId,
            messageId,
            analysisCriteriaId,
          };
          setPendingResultCancelParams(resultParams);
          resultAnalysisMutation.mutate(
            {
              targetConversationId: conversationId,
              targetAnalysisFlowId: analysisFlowId,
              messageId,
              analysisCriteriaId,
            },
            {
              onSuccess: (result) => {
                clearPendingResultCancelParams(resultParams);
                dispatchFlow({ type: 'criteria-submission-finished' });
                appendResultMessage(result);
              },
              onError: (error, variables) => {
                clearPendingResultCancelParams(variables);
                if (
                  canceledResultKeysRef.current.delete(
                    getResultCancelKey(variables),
                  )
                ) {
                  return;
                }

                dispatchFlow({ type: 'criteria-submission-finished' });
                const message = getAnalysisErrorMessage(
                  error,
                  GET_RESULT_ERROR_MESSAGE,
                );
                showToast(message);
                appendNotice(message, 'error');
              },
            },
          );
        },
        onError: (error) => {
          setPendingResultCancelParams(null);
          dispatchFlow({ type: 'criteria-submission-finished' });
          const message = getAnalysisErrorMessage(
            error,
            UPDATE_CRITERIA_ERROR_MESSAGE,
          );
          showToast(message);
          appendNotice(message, 'error');
        },
      },
    );
  }

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
  const questionAnalysisActive =
    isQuestionAnalysisPending && pendingCriteriaOperationKey !== null;
  const resultAnalysisActive =
    resultAnalysisMutation.isPending && pendingResultCancelParams !== null;
  const shouldShowAnalyzing =
    summaryPending ||
    questionAnalysisActive ||
    updateCriteriaMutation.isPending ||
    resultAnalysisActive;
  const activeCancelTarget = getAnalysisCancelTarget({
    analysisFlowId,
    conversationId,
    isQuestionAnalysisPending: questionAnalysisActive,
    isResultAnalysisPending: resultAnalysisActive,
    pendingCriteriaCancelTarget,
    pendingResultCancelParams,
    summaryPending,
  });
  const handleCancelAnalyzing = () => {
    if (!activeCancelTarget || cancelAnalysisMutation.isPending) return;

    cancelAnalysisMutation.mutate(activeCancelTarget);
  };
  const analyzingMessage = summaryPending
    ? 'CSV 데이터를 분석 중이에요'
    : updateCriteriaMutation.isPending
      ? '분석 기준을 확정 중이에요'
      : resultAnalysisMutation.isPending
        ? '최종 분석 결과를 생성 중이에요'
        : '질문을 분석 중이에요';
  const inputDisabled =
    !summary ||
    questionAnalysisActive ||
    updateCriteriaMutation.isPending ||
    resultAnalysisActive;
  const summaryWarnings = summary?.warnings ?? [];
  const summaryActionDisabled =
    hasStartedInitialQuestion ||
    !hasResolvedStartPayload ||
    !canAutoStartInitialQuestion ||
    questionAnalysisActive ||
    updateCriteriaMutation.isPending;
  const criteriaSubmitting =
    criteriaSubmissionLocked ||
    updateCriteriaMutation.isPending ||
    resultAnalysisActive;
  const currentSummaryKey =
    conversationId !== null && analysisFlowId !== null
      ? getAnalysisFlowKey({ analysisFlowId, conversationId })
      : null;
  const hasCanceledCurrentSummary =
    currentSummaryKey !== null && canceledSummaryKey === currentSummaryKey;

  return {
    analyzingMessage,
    canCancelAnalyzing: activeCancelTarget !== null,
    cancelAnalyzingDisabled: cancelAnalysisMutation.isPending,
    criteriaSubmitting,
    handleCancelAnalyzing,
    handleConfirmCriteria,
    handleSubmit,
    initialMessage,
    inputDisabled,
    dataSourceErrorMessage,
    isDataSourceLoading,
    isDataSourceEmpty,
    previewTable,
    restMessages,
    shouldShowAnalyzing,
    startInitialQuestion,
    summary,
    summaryActionDisabled,
    summaryColumnOptions,
    summaryErrorMessage: hasCanceledCurrentSummary ? null : summaryErrorMessage,
    summarySortOptions,
    summaryWarnings,
    toast,
  };
}

export type UseAnalysisChatResult = ReturnType<typeof useAnalysisChat>;

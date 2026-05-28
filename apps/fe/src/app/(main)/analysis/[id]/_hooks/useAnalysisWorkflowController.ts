'use client';

import { useCallback, useRef, useState } from 'react';
import type { QuestionResultParams } from '@/apis/analysis';
import { markAnalysisStartPayloadConsumed } from '@/lib/analysisStartPayload';
import type { PromptInputValue } from '../../_components/PromptInput';
import { getAnalysisErrorMessage } from '../_adapters/normalizeAnalysisError';
import { createUpdateCriteriaRequest } from '../_adapters/normalizeCriteria';
import type {
  CriteriaEditValues,
  CriteriaViewModel,
  QuestionResultViewModel,
  SummaryViewModel,
} from '../_models/analysisViewModels';
import {
  getResultCancelKey,
  type PendingCriteriaCancelTarget,
} from '../_utils/analysisCancelTarget';
import { useAnalysisCancelController } from './useAnalysisCancelController';
import type { CriteriaInitialMode } from './useAnalysisChatMessages';
import { useCriteriaPhase } from './useCriteriaPhase';
import { useResultPhase } from './useResultPhase';

const STATUS_POLL_INTERVAL_MS = 1500;
const QUESTION_ANALYSIS_TIMEOUT_MS = 120000;
const RESULT_ANALYSIS_TIMEOUT_MS = 120000;
const INVALID_ROUTE_MESSAGE = '분석 정보를 찾지 못했어요. 다시 시작해 주세요.';
const SUMMARY_NOT_READY_MESSAGE = 'CSV 데이터 요약이 끝난 뒤 질문할 수 있어요.';
const CREATE_QUESTION_ERROR_MESSAGE =
  '질문 분석을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.';
const GET_CRITERIA_ERROR_MESSAGE =
  '분석 기준을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
const UPDATE_CRITERIA_ERROR_MESSAGE =
  '분석 기준을 확정하지 못했어요. 잠시 후 다시 시도해 주세요.';
const GET_RESULT_ERROR_MESSAGE =
  '최종 분석 결과를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';

type UseAnalysisWorkflowControllerParams = {
  analysisFlowId: number | null;
  appendCriteriaMessage: (
    criteria: CriteriaViewModel,
    initialMode?: CriteriaInitialMode,
  ) => void;
  appendNotice: (content: string, tone?: 'default' | 'error') => void;
  appendResultMessage: (result: QuestionResultViewModel) => void;
  appendUserQuestion: (content: string) => void;
  canAutoStartInitialQuestion: boolean;
  conversationId: number | null;
  criteriaSubmissionLocked: boolean;
  dispatchCriteriaSubmissionFinished: () => void;
  dispatchCriteriaSubmissionStarted: () => void;
  dispatchInitialQuestionStarted: () => void;
  dispatchQuestionSubmissionFinished: () => void;
  dispatchQuestionSubmissionStarted: () => void;
  hasResolvedStartPayload: boolean;
  hasStartedInitialQuestion: boolean;
  questionSubmissionLocked: boolean;
  showToast: (message: string) => void;
  summary: SummaryViewModel | undefined;
  summaryPending: boolean;
};

export function useAnalysisWorkflowController({
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
}: UseAnalysisWorkflowControllerParams) {
  const operationSequenceRef = useRef(0);
  const [pendingCriteriaOperationKey, setPendingCriteriaOperationKey] =
    useState<string | null>(null);
  const [pendingCriteriaCancelTarget, setPendingCriteriaCancelTarget] =
    useState<PendingCriteriaCancelTarget | null>(null);
  const [pendingResultCancelParams, setPendingResultCancelParams] =
    useState<QuestionResultParams | null>(null);

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

  const questionAnalysisActive =
    isQuestionAnalysisPending && pendingCriteriaOperationKey !== null;
  const resultAnalysisActive =
    resultAnalysisMutation.isPending && pendingResultCancelParams !== null;
  const cancelController = useAnalysisCancelController({
    analysisFlowId,
    appendNotice,
    clearPendingCriteriaOperation,
    clearPendingResultCancelParams,
    conversationId,
    onCriteriaCanceled: dispatchQuestionSubmissionFinished,
    onResultCanceled: dispatchCriteriaSubmissionFinished,
    pendingCriteriaCancelTarget,
    pendingResultCancelParams,
    questionAnalysisActive,
    resultAnalysisActive,
    showToast,
    summaryPending,
  });
  const { consumeCanceledCriteriaOperation, consumeCanceledResult } =
    cancelController;

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
      dispatchQuestionSubmissionStarted();

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
            dispatchQuestionSubmissionFinished();
            appendCriteriaMessage(criteria, variables.initialMode);
          },
          onError: (error, variables) => {
            clearPendingCriteriaOperation(variables.operationKey);
            if (consumeCanceledCriteriaOperation(variables.operationKey)) {
              return;
            }

            dispatchQuestionSubmissionFinished();
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
      consumeCanceledCriteriaOperation,
      conversationId,
      createOperationKey,
      dispatchQuestionSubmissionFinished,
      dispatchQuestionSubmissionStarted,
      mutateQuestionAnalysis,
      questionSubmissionLocked,
      showToast,
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
      dispatchInitialQuestionStarted();
      startQuestion(value.prompt);
    },
    [
      conversationId,
      dispatchInitialQuestionStarted,
      showToast,
      startQuestion,
      summary,
    ],
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

    dispatchCriteriaSubmissionStarted();
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
                dispatchCriteriaSubmissionFinished();
                appendResultMessage(result);
              },
              onError: (error, variables) => {
                clearPendingResultCancelParams(variables);
                if (consumeCanceledResult(variables)) {
                  return;
                }

                dispatchCriteriaSubmissionFinished();
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
          dispatchCriteriaSubmissionFinished();
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

  const shouldShowAnalyzing =
    summaryPending ||
    questionAnalysisActive ||
    updateCriteriaMutation.isPending ||
    resultAnalysisActive;
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

  return {
    analyzingMessage,
    canCancelAnalyzing: cancelController.canCancelAnalyzing,
    cancelAnalyzingDisabled: cancelController.cancelAnalyzingDisabled,
    criteriaSubmitting,
    handleCancelAnalyzing: cancelController.handleCancelAnalyzing,
    handleConfirmCriteria,
    handleSubmit,
    hasCanceledCurrentSummary: cancelController.hasCanceledCurrentSummary,
    inputDisabled,
    shouldShowAnalyzing,
    startQuestion,
    summaryActionDisabled,
  };
}

'use client';

import { useCallback, useState } from 'react';
import type { QuestionResultParams } from '@/apis/analysis';
import { getAnalysisErrorMessage } from '../_adapters/normalizeAnalysisError';
import { createUpdateCriteriaRequest } from '../_adapters/normalizeCriteria';
import type {
  CriteriaEditValues,
  QuestionResultViewModel,
} from '../_models/analysisViewModels';
import { getResultCancelKey } from '../_utils/analysisCancelTarget';
import { useUpdateCriteriaMutation } from './useCriteriaPhase';
import { useResultPhase } from './useResultPhase';

const STATUS_POLL_INTERVAL_MS = 1500;
const RESULT_ANALYSIS_TIMEOUT_MS = 120000;
const INVALID_ROUTE_MESSAGE = '분석 정보를 찾지 못했어요. 다시 시작해 주세요.';
const UPDATE_CRITERIA_ERROR_MESSAGE =
  '분석 기준을 확정하지 못했어요. 잠시 후 다시 시도해 주세요.';
const GET_RESULT_ERROR_MESSAGE =
  '최종 분석 결과를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';

type UseCriteriaConfirmationControllerParams = {
  analysisFlowId: number | null;
  appendNotice: (content: string, tone?: 'default' | 'error') => void;
  appendResultMessage: (result: QuestionResultViewModel) => void;
  consumeCanceledResult: (
    params: Pick<QuestionResultParams, 'analysisCriteriaId' | 'messageId'>,
  ) => boolean;
  conversationId: number | null;
  criteriaSubmissionLocked: boolean;
  dispatchCriteriaSubmissionFinished: () => void;
  dispatchCriteriaSubmissionStarted: () => void;
  showToast: (message: string) => void;
};

export function useCriteriaConfirmationController({
  analysisFlowId,
  appendNotice,
  appendResultMessage,
  consumeCanceledResult,
  conversationId,
  criteriaSubmissionLocked,
  dispatchCriteriaSubmissionFinished,
  dispatchCriteriaSubmissionStarted,
  showToast,
}: UseCriteriaConfirmationControllerParams) {
  const [pendingResultCancelParams, setPendingResultCancelParams] =
    useState<QuestionResultParams | null>(null);
  const updateCriteriaMutation = useUpdateCriteriaMutation();
  const resultAnalysisMutation = useResultPhase({
    getResultErrorMessage: GET_RESULT_ERROR_MESSAGE,
    resultAnalysisTimeoutMs: RESULT_ANALYSIS_TIMEOUT_MS,
    statusPollIntervalMs: STATUS_POLL_INTERVAL_MS,
  });

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

  const handleConfirmCriteria = useCallback(
    (messageId: number, values: CriteriaEditValues) => {
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
    },
    [
      analysisFlowId,
      appendNotice,
      appendResultMessage,
      clearPendingResultCancelParams,
      consumeCanceledResult,
      conversationId,
      criteriaSubmissionLocked,
      dispatchCriteriaSubmissionFinished,
      dispatchCriteriaSubmissionStarted,
      resultAnalysisMutation,
      showToast,
      updateCriteriaMutation,
    ],
  );
  const resultAnalysisActive =
    resultAnalysisMutation.isPending && pendingResultCancelParams !== null;

  return {
    clearPendingResultCancelParams,
    handleConfirmCriteria,
    pendingResultCancelParams,
    resultAnalysisActive,
    resultAnalysisPending: resultAnalysisMutation.isPending,
    updateCriteriaPending: updateCriteriaMutation.isPending,
  };
}

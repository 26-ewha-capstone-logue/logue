'use client';

import { useCallback, useState } from 'react';
import type { QuestionResultParams } from '@/apis/analysis';
import { getAnalysisErrorMessage } from '../_adapters/normalizeAnalysisError';
import { createUpdateCriteriaRequest } from '../_adapters/normalizeCriteria';
import { ANALYSIS_WORKFLOW_MESSAGES } from '../_config/analysisWorkflowMessages';
import { ANALYSIS_JOB_POLICY } from '../_config/analysisWorkflowPolicy';
import type {
  CriteriaEditValues,
  QuestionResultViewModel,
} from '../_models/analysisViewModels';
import { getResultCancelKey } from '../_utils/analysisCancelTarget';
import { useUpdateCriteriaMutation } from './useCriteriaPhase';
import { useResultPhase } from './useResultPhase';

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
    getResultErrorMessage: ANALYSIS_WORKFLOW_MESSAGES.result.getError,
    resultAnalysisTimeoutMs: ANALYSIS_JOB_POLICY.resultAnalysisTimeoutMs,
    statusPollIntervalMs: ANALYSIS_JOB_POLICY.statusPollIntervalMs,
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
        showToast(ANALYSIS_WORKFLOW_MESSAGES.invalidRoute);
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
            appendNotice(ANALYSIS_WORKFLOW_MESSAGES.criteria.confirmed);
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
                    ANALYSIS_WORKFLOW_MESSAGES.result.getError,
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
              ANALYSIS_WORKFLOW_MESSAGES.criteria.updateError,
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

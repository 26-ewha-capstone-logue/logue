'use client';

import { useCallback } from 'react';
import type { QuestionResultParams } from '@/apis/analysis';
import { getAnalysisErrorMessage } from '../adapters/normalizeAnalysisError';
import { createUpdateCriteriaRequest } from '@/features/analysis/adapters/normalizeCriteria';
import { ANALYSIS_WORKFLOW_MESSAGES } from '../config/analysisWorkflowMessages';
import { ANALYSIS_JOB_POLICY } from '../config/analysisWorkflowPolicy';
import type { CriteriaEditValues } from '@/features/analysis/models/analysisViewModels';
import { getResultCancelKey } from '../utils/analysisCancelTarget';
import { useAnalysisJobSlot } from './useAnalysisJobSlot';
import { useUpdateCriteriaMutation } from './useCriteriaPhase';
import { useResultPhase } from './useResultPhase';
import type { AnalysisWorkflowEffects } from './useAnalysisWorkflowEffects';
import type { AnalysisWorkflowRoute } from './analysisWorkflowTypes';

type UseCriteriaConfirmationControllerParams = {
  cancellation: {
    consumeCanceledResult: (
      params: Pick<QuestionResultParams, 'analysisCriteriaId' | 'messageId'>,
    ) => boolean;
  };
  effects: AnalysisWorkflowEffects;
  pending: {
    criteriaSubmissionLocked: boolean;
  };
  route: AnalysisWorkflowRoute;
};

function usePendingResultAnalysisPhase(
  pendingResultParams: QuestionResultParams | null,
) {
  return useResultPhase({
    enabled: pendingResultParams !== null,
    getResultErrorMessage: ANALYSIS_WORKFLOW_MESSAGES.result.getError,
    params: pendingResultParams,
    resultAnalysisTimeoutMs: ANALYSIS_JOB_POLICY.resultAnalysisTimeoutMs,
    statusPollIntervalMs: ANALYSIS_JOB_POLICY.statusPollIntervalMs,
  });
}

export function useCriteriaConfirmationController({
  cancellation,
  effects,
  pending,
  route,
}: UseCriteriaConfirmationControllerParams) {
  const { consumeCanceledResult } = cancellation;
  const { dispatch, messages, notify } = effects;
  const { criteriaSubmissionLocked } = pending;
  const { analysisFlowId, conversationId } = route;
  const updateCriteriaMutation = useUpdateCriteriaMutation();
  const resultSlot = useAnalysisJobSlot({
    getJobKey: getResultCancelKey,
    onError: (pendingResultParams, error) => {
      if (consumeCanceledResult(pendingResultParams)) {
        return;
      }

      dispatch.criteriaSubmissionFailed();
      notify.showToast(error.message);
      messages.appendNotice(error.message, 'error');
    },
    onResult: (pendingResultParams, result) => {
      if (consumeCanceledResult(pendingResultParams)) {
        return;
      }

      dispatch.criteriaSubmissionSucceeded();
      messages.appendResultMessage(result);
    },
    usePhase: usePendingResultAnalysisPhase,
  });

  const clearPendingResultCancelParams = useCallback(
    (params: Pick<QuestionResultParams, 'analysisCriteriaId' | 'messageId'>) =>
      resultSlot.clearSlot(getResultCancelKey(params)),
    [resultSlot],
  );

  const handleConfirmCriteria = useCallback(
    (messageId: number, values: CriteriaEditValues) => {
      if (
        criteriaSubmissionLocked ||
        resultSlot.isSlotActive() ||
        updateCriteriaMutation.isPending
      ) {
        return;
      }

      if (conversationId === null || analysisFlowId === null) {
        notify.showToast(ANALYSIS_WORKFLOW_MESSAGES.invalidRoute);
        return;
      }

      resultSlot.startSlot();
      dispatch.criteriaSubmissionStarted();

      updateCriteriaMutation.mutate(
        {
          targetConversationId: conversationId,
          targetAnalysisFlowId: analysisFlowId,
          messageId,
          request: createUpdateCriteriaRequest(values),
        },
        {
          onSuccess: ({ analysisCriteriaId }) => {
            messages.appendNotice(
              ANALYSIS_WORKFLOW_MESSAGES.criteria.confirmed,
            );
            resultSlot.setSlotJob({
              conversationId,
              analysisFlowId,
              messageId,
              analysisCriteriaId,
            });
          },
          onError: (error) => {
            resultSlot.resetSlot();
            dispatch.criteriaSubmissionFailed();
            const message = getAnalysisErrorMessage(
              error,
              ANALYSIS_WORKFLOW_MESSAGES.criteria.updateError,
            );
            notify.showToast(message);
            messages.appendNotice(message, 'error');
          },
        },
      );
    },
    [
      analysisFlowId,
      conversationId,
      criteriaSubmissionLocked,
      dispatch,
      messages,
      notify,
      resultSlot,
      updateCriteriaMutation,
    ],
  );
  const resultAnalysisActive =
    resultSlot.phase.pending && resultSlot.pendingJob !== null;

  return {
    clearPendingResultCancelParams,
    handleConfirmCriteria,
    pendingResultCancelParams: resultSlot.pendingJob,
    resultAnalysisActive,
    resultAnalysisPending: resultSlot.phase.pending,
    updateCriteriaPending: updateCriteriaMutation.isPending,
  };
}

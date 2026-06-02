'use client';

import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  analysisQueryKeys,
  cancelCriteria,
  cancelResult,
  cancelSummary,
  type AnalysisStatusResponse,
  type QuestionResultParams,
} from '@/apis/analysis';
import { getAnalysisErrorMessage } from '../adapters/normalizeAnalysisError';
import { ANALYSIS_WORKFLOW_MESSAGES } from '../config/analysisWorkflowMessages';
import {
  getAnalysisCancelTarget,
  type AnalysisCancelTarget,
  type PendingCriteriaCancelTarget,
} from '../utils/analysisCancelTarget';
import type { AnalysisWorkflowEffects } from './useAnalysisWorkflowEffects';
import type { AnalysisWorkflowRoute } from './analysisWorkflowTypes';

type UseAnalysisCancelControllerParams = {
  cancellation: {
    clearPendingCriteriaOperation: (operationKey: string) => void;
    clearPendingResultCancelParams: (
      params: Pick<QuestionResultParams, 'analysisCriteriaId' | 'messageId'>,
    ) => void;
    markCriteriaCanceled: (operationKey: string) => void;
    markResultCanceled: (params: QuestionResultParams) => void;
  };
  effects: AnalysisWorkflowEffects;
  pending: {
    pendingCriteriaCancelTarget: PendingCriteriaCancelTarget | null;
    pendingResultCancelParams: QuestionResultParams | null;
    questionAnalysisActive: boolean;
    resultAnalysisActive: boolean;
    summaryPending: boolean;
  };
  route: AnalysisWorkflowRoute;
};

function getAnalysisFlowKey({
  analysisFlowId,
  conversationId,
}: {
  analysisFlowId: number;
  conversationId: number;
}) {
  return `${conversationId}:${analysisFlowId}`;
}

export function useAnalysisCancelController({
  cancellation,
  effects,
  pending,
  route,
}: UseAnalysisCancelControllerParams) {
  const {
    clearPendingCriteriaOperation,
    clearPendingResultCancelParams,
    markCriteriaCanceled,
    markResultCanceled,
  } = cancellation;
  const { dispatch, messages, notify } = effects;
  const {
    pendingCriteriaCancelTarget,
    pendingResultCancelParams,
    questionAnalysisActive,
    resultAnalysisActive,
    summaryPending,
  } = pending;
  const { analysisFlowId, conversationId } = route;
  const queryClient = useQueryClient();
  const [canceledSummaryKey, setCanceledSummaryKey] = useState<string | null>(
    null,
  );

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
        dispatch.summaryCanceled();
        messages.appendNotice(ANALYSIS_WORKFLOW_MESSAGES.summary.canceled);
        return;
      }

      if (target.stage === 'criteria') {
        markCriteriaCanceled(target.operationKey);
        clearPendingCriteriaOperation(target.operationKey);
        dispatch.questionSubmissionCanceled();
        messages.appendNotice(ANALYSIS_WORKFLOW_MESSAGES.question.canceled);
        return;
      }

      markResultCanceled(target.params);
      clearPendingResultCancelParams(target.params);
      dispatch.criteriaSubmissionCanceled();
      messages.appendNotice(ANALYSIS_WORKFLOW_MESSAGES.result.canceled);
    },
    onError: (error) => {
      const message = getAnalysisErrorMessage(
        error,
        ANALYSIS_WORKFLOW_MESSAGES.cancel.error,
      );
      notify.showToast(message);
      messages.appendNotice(message, 'error');
    },
  });

  const activeCancelTarget = getAnalysisCancelTarget({
    analysisFlowId,
    conversationId,
    isQuestionAnalysisPending: questionAnalysisActive,
    isResultAnalysisPending: resultAnalysisActive,
    pendingCriteriaCancelTarget,
    pendingResultCancelParams,
    summaryPending,
  });
  const handleCancelAnalyzing = useCallback(() => {
    if (!activeCancelTarget || cancelAnalysisMutation.isPending) return;

    cancelAnalysisMutation.mutate(activeCancelTarget);
  }, [activeCancelTarget, cancelAnalysisMutation]);
  const currentSummaryKey =
    conversationId !== null && analysisFlowId !== null
      ? getAnalysisFlowKey({ analysisFlowId, conversationId })
      : null;
  const hasCanceledCurrentSummary =
    currentSummaryKey !== null && canceledSummaryKey === currentSummaryKey;

  return {
    canCancelAnalyzing: activeCancelTarget !== null,
    cancelAnalyzingDisabled: cancelAnalysisMutation.isPending,
    handleCancelAnalyzing,
    hasCanceledCurrentSummary,
  };
}

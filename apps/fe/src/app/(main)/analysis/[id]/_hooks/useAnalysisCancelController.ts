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
import { getAnalysisErrorMessage } from '../_adapters/normalizeAnalysisError';
import {
  getAnalysisCancelTarget,
  type AnalysisCancelTarget,
  type PendingCriteriaCancelTarget,
} from '../_utils/analysisCancelTarget';

const CANCEL_ANALYSIS_ERROR_MESSAGE =
  '분석을 취소하지 못했어요. 잠시 후 다시 시도해 주세요.';
const SUMMARY_CANCELED_MESSAGE = 'CSV 데이터 요약을 취소했어요.';
const CRITERIA_CANCELED_MESSAGE = '질문 분석을 취소했어요.';
const RESULT_CANCELED_MESSAGE = '최종 분석 결과 생성을 취소했어요.';

type UseAnalysisCancelControllerParams = {
  analysisFlowId: number | null;
  appendNotice: (content: string, tone?: 'default' | 'error') => void;
  clearPendingCriteriaOperation: (operationKey: string) => void;
  clearPendingResultCancelParams: (
    params: Pick<QuestionResultParams, 'analysisCriteriaId' | 'messageId'>,
  ) => void;
  conversationId: number | null;
  markCriteriaCanceled: (operationKey: string) => void;
  markResultCanceled: (params: QuestionResultParams) => void;
  onCriteriaCanceled: () => void;
  onResultCanceled: () => void;
  pendingCriteriaCancelTarget: PendingCriteriaCancelTarget | null;
  pendingResultCancelParams: QuestionResultParams | null;
  questionAnalysisActive: boolean;
  resultAnalysisActive: boolean;
  showToast: (message: string) => void;
  summaryPending: boolean;
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
  analysisFlowId,
  appendNotice,
  clearPendingCriteriaOperation,
  clearPendingResultCancelParams,
  conversationId,
  markCriteriaCanceled,
  markResultCanceled,
  onCriteriaCanceled,
  onResultCanceled,
  pendingCriteriaCancelTarget,
  pendingResultCancelParams,
  questionAnalysisActive,
  resultAnalysisActive,
  showToast,
  summaryPending,
}: UseAnalysisCancelControllerParams) {
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
        appendNotice(SUMMARY_CANCELED_MESSAGE);
        return;
      }

      if (target.stage === 'criteria') {
        markCriteriaCanceled(target.operationKey);
        clearPendingCriteriaOperation(target.operationKey);
        onCriteriaCanceled();
        appendNotice(CRITERIA_CANCELED_MESSAGE);
        return;
      }

      markResultCanceled(target.params);
      clearPendingResultCancelParams(target.params);
      onResultCanceled();
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

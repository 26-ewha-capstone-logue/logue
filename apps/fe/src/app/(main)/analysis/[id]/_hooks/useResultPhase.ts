'use client';

import { useMutation } from '@tanstack/react-query';
import {
  getResult,
  getResultStatus,
  type QuestionResultParams,
} from '@/apis/analysis';
import { useJobPoller } from './useJobPoller';

export type ResultAnalysisVariables = {
  targetConversationId: number;
  targetAnalysisFlowId: number;
  messageId: number;
  analysisCriteriaId: number;
};

type UseResultPhaseOptions = {
  getResultErrorMessage: string;
  resultAnalysisTimeoutMs: number;
  statusPollIntervalMs: number;
};

export function useResultPhase({
  getResultErrorMessage,
  resultAnalysisTimeoutMs,
  statusPollIntervalMs,
}: UseResultPhaseOptions) {
  const waitForResultSuccess = useJobPoller<QuestionResultParams>(
    getResultStatus,
    {
      errorMessage: getResultErrorMessage,
      intervalMs: statusPollIntervalMs,
      timeoutMs: resultAnalysisTimeoutMs,
    },
  );

  return useMutation({
    mutationFn: async ({
      targetConversationId,
      targetAnalysisFlowId,
      messageId,
      analysisCriteriaId,
    }: ResultAnalysisVariables) => {
      const resultParams = {
        conversationId: targetConversationId,
        analysisFlowId: targetAnalysisFlowId,
        messageId,
        analysisCriteriaId,
      };

      await waitForResultSuccess(resultParams);
      return getResult(resultParams);
    },
  });
}

'use client';

import {
  getResult,
  getResultStatus,
  type QuestionResultParams,
} from '@/apis/analysis';
import { normalizeResult } from '../adapters/normalizeResult';
import { useAnalysisJobPhase } from './useAnalysisJobPhase';

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
  return useAnalysisJobPhase({
    errorMessage: getResultErrorMessage,
    fetchResult: getResult,
    fetchStatus: getResultStatus,
    intervalMs: statusPollIntervalMs,
    normalizeResult,
    prepareParams: ({
      targetConversationId,
      targetAnalysisFlowId,
      messageId,
      analysisCriteriaId,
    }: ResultAnalysisVariables): QuestionResultParams => {
      return {
        conversationId: targetConversationId,
        analysisFlowId: targetAnalysisFlowId,
        messageId,
        analysisCriteriaId,
      };
    },
    timeoutMs: resultAnalysisTimeoutMs,
  });
}

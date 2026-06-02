'use client';

import {
  analysisQueryKeys,
  getResult,
  getResultStatus,
  type QuestionResultParams,
} from '@/apis/analysis';
import { ANALYSIS_WORKFLOW_MESSAGES } from '../config/analysisWorkflowMessages';
import { normalizeResult } from '../adapters/normalizeResult';
import { useAnalysisQueryJobPhase } from './useAnalysisQueryJobPhase';

type UseResultPhaseOptions = {
  enabled: boolean;
  getResultErrorMessage: string;
  params: QuestionResultParams | null;
  resultAnalysisTimeoutMs: number;
  statusPollIntervalMs: number;
};

export function useResultPhase({
  enabled,
  getResultErrorMessage,
  params,
  resultAnalysisTimeoutMs,
  statusPollIntervalMs,
}: UseResultPhaseOptions) {
  return useAnalysisQueryJobPhase({
    enabled,
    failedMessage: getResultErrorMessage,
    fetchResult: getResult,
    fetchStatus: getResultStatus,
    getResultErrorMessage,
    invalidRouteMessage: ANALYSIS_WORKFLOW_MESSAGES.invalidRoute,
    intervalMs: statusPollIntervalMs,
    normalizeResult,
    params,
    resultQueryKey: analysisQueryKeys.result(
      params?.conversationId ?? 0,
      params?.analysisFlowId ?? 0,
      params?.messageId ?? 0,
      params?.analysisCriteriaId ?? 0,
    ),
    statusQueryKey: analysisQueryKeys.resultStatus(
      params?.conversationId ?? 0,
      params?.analysisFlowId ?? 0,
      params?.messageId ?? 0,
      params?.analysisCriteriaId ?? 0,
    ),
    timeoutMs: resultAnalysisTimeoutMs,
  });
}

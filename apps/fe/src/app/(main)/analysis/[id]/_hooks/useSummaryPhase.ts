'use client';

import {
  analysisQueryKeys,
  getSummary,
  getSummaryStatus,
} from '@/apis/analysis';
import { normalizeSummary } from '../_adapters/normalizeSummary';
import { useAnalysisQueryJobPhase } from './useAnalysisQueryJobPhase';

type UseSummaryPhaseParams = {
  analysisFlowId: number | null;
  conversationId: number | null;
  failedSummaryMessage: string;
  getSummaryErrorMessage: string;
  invalidRouteMessage: string;
  routeReady: boolean;
  statusPollIntervalMs: number;
};

export function useSummaryPhase({
  analysisFlowId,
  conversationId,
  failedSummaryMessage,
  getSummaryErrorMessage,
  invalidRouteMessage,
  routeReady,
  statusPollIntervalMs,
}: UseSummaryPhaseParams) {
  const statusParams =
    conversationId === null || analysisFlowId === null
      ? null
      : { conversationId, analysisFlowId };
  const summaryPhase = useAnalysisQueryJobPhase({
    enabled: routeReady,
    failedMessage: failedSummaryMessage,
    fetchResult: getSummary,
    fetchStatus: getSummaryStatus,
    getResultErrorMessage: getSummaryErrorMessage,
    invalidRouteMessage,
    intervalMs: statusPollIntervalMs,
    normalizeResult: normalizeSummary,
    params: statusParams,
    resultQueryKey: analysisQueryKeys.summary(
      conversationId ?? 0,
      analysisFlowId ?? 0,
    ),
    statusQueryKey: analysisQueryKeys.summaryStatus(
      conversationId ?? 0,
      analysisFlowId ?? 0,
    ),
  });

  return {
    summary: summaryPhase.result,
    summaryError: summaryPhase.error,
    summaryErrorMessage: summaryPhase.errorMessage,
    summaryPending: summaryPhase.pending,
    summaryQuery: summaryPhase.resultQuery,
    summaryStatus: summaryPhase.status,
    summaryStatusQuery: summaryPhase.statusQuery,
  };
}

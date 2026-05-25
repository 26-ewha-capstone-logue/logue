'use client';

import { useQuery } from '@tanstack/react-query';
import {
  analysisQueryKeys,
  getSummary,
  getSummaryStatus,
} from '@/apis/analysis';
import {
  normalizeAnalysisError,
  normalizeAnalysisStatusError,
} from '../_adapters/normalizeAnalysisError';
import { normalizeSummary } from '../_adapters/normalizeSummary';
import { isFailedJobStatus, shouldPollJobStatus } from './useJobPoller';

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
  const summaryStatusQuery = useQuery({
    queryKey: analysisQueryKeys.summaryStatus(
      conversationId ?? 0,
      analysisFlowId ?? 0,
    ),
    queryFn: () => {
      if (conversationId === null || analysisFlowId === null) {
        throw new Error(invalidRouteMessage);
      }

      return getSummaryStatus({ conversationId, analysisFlowId });
    },
    enabled: routeReady,
    refetchInterval: (query) => {
      const status = query.state.data?.status;

      if (query.state.error || !status) return false;

      return shouldPollJobStatus(status) ? statusPollIntervalMs : false;
    },
  });
  const summaryStatus = routeReady
    ? summaryStatusQuery.data?.status
    : undefined;

  const summaryQuery = useQuery({
    queryKey: analysisQueryKeys.summary(
      conversationId ?? 0,
      analysisFlowId ?? 0,
    ),
    queryFn: () => {
      if (conversationId === null || analysisFlowId === null) {
        throw new Error(invalidRouteMessage);
      }

      return getSummary({ conversationId, analysisFlowId });
    },
    enabled: routeReady && summaryStatus === 'SUCCESS',
    select: normalizeSummary,
  });

  const summary = routeReady ? summaryQuery.data : undefined;
  const summaryError = !routeReady
    ? normalizeAnalysisError(
        new Error(invalidRouteMessage),
        invalidRouteMessage,
      )
    : summaryStatusQuery.isError
      ? normalizeAnalysisError(summaryStatusQuery.error, getSummaryErrorMessage)
      : summaryQuery.isError
        ? normalizeAnalysisError(summaryQuery.error, getSummaryErrorMessage)
        : normalizeAnalysisStatusError(summaryStatus, failedSummaryMessage);
  const summaryPending =
    routeReady &&
    !summaryStatusQuery.isError &&
    !summaryQuery.isError &&
    !summary &&
    !isFailedJobStatus(summaryStatus);
  const summaryErrorMessage = summaryError?.message ?? null;

  return {
    summary,
    summaryError,
    summaryErrorMessage,
    summaryPending,
    summaryQuery,
    summaryStatus,
    summaryStatusQuery,
  };
}

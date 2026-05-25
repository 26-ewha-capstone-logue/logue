'use client';

import { useQuery } from '@tanstack/react-query';
import {
  analysisQueryKeys,
  getSummary,
  getSummaryStatus,
} from '@/apis/analysis';
import { getApiErrorMessage } from '@/apis/errors';
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
  const summaryStatus = summaryStatusQuery.data?.status;

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
  });

  const summary = summaryQuery.data;
  const summaryPending =
    routeReady &&
    !summaryStatusQuery.isError &&
    !summaryQuery.isError &&
    !summary &&
    !isFailedJobStatus(summaryStatus);
  const summaryErrorMessage = !routeReady
    ? invalidRouteMessage
    : summaryStatusQuery.isError
      ? getApiErrorMessage(summaryStatusQuery.error, getSummaryErrorMessage)
      : summaryQuery.isError
        ? getApiErrorMessage(summaryQuery.error, getSummaryErrorMessage)
        : isFailedJobStatus(summaryStatus)
          ? failedSummaryMessage
          : null;

  return {
    summary,
    summaryErrorMessage,
    summaryPending,
    summaryQuery,
    summaryStatus,
    summaryStatusQuery,
  };
}

'use client';

import { useQuery, type QueryKey } from '@tanstack/react-query';
import type { AnalysisStatusResponse } from '@/apis/analysis';
import { shouldPollJobStatus } from './useJobPoller';

type UseAnalysisStatusPollingParams<TParams> = {
  enabled: boolean;
  fetchStatus: (params: TParams) => Promise<AnalysisStatusResponse>;
  invalidRouteMessage: string;
  intervalMs: number;
  params: TParams | null;
  queryKey: QueryKey;
};

export function useAnalysisStatusPolling<TParams>({
  enabled,
  fetchStatus,
  invalidRouteMessage,
  intervalMs,
  params,
  queryKey,
}: UseAnalysisStatusPollingParams<TParams>) {
  return useQuery({
    queryKey,
    queryFn: () => {
      if (params === null) {
        throw new Error(invalidRouteMessage);
      }

      return fetchStatus(params);
    },
    enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;

      if (query.state.error || !status) return false;

      return shouldPollJobStatus(status) ? intervalMs : false;
    },
  });
}

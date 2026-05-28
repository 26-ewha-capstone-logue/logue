'use client';

import { useQuery, type QueryKey } from '@tanstack/react-query';
import type { AnalysisStatusResponse } from '@/apis/analysis';
import { getAnalysisStatusRefetchInterval } from '../_utils/analysisPolling';

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
      return getAnalysisStatusRefetchInterval({
        hasError: query.state.error !== null,
        intervalMs,
        status: query.state.data?.status,
      });
    },
  });
}

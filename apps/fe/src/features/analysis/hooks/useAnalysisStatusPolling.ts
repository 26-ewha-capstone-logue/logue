'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useQuery, type QueryKey } from '@tanstack/react-query';
import type { AnalysisStatusResponse } from '@/apis/analysis';
import { shouldPollAnalysisStatus } from '../adapters/normalizeAnalysisError';

type UseAnalysisStatusPollingParams<TParams> = {
  enabled: boolean;
  fetchStatus: (params: TParams) => Promise<AnalysisStatusResponse>;
  invalidRouteMessage: string;
  intervalMs: number;
  params: TParams | null;
  queryKey: QueryKey;
  timeoutMessage?: string;
  timeoutMs?: number;
};

export function hasAnalysisPollingTimedOut({
  now,
  startedAt,
  timeoutMs,
}: {
  now: number;
  startedAt: number;
  timeoutMs?: number;
}) {
  return timeoutMs !== undefined && now - startedAt >= timeoutMs;
}

export function useAnalysisStatusPolling<TParams>({
  enabled,
  fetchStatus,
  invalidRouteMessage,
  intervalMs,
  params,
  queryKey,
  timeoutMessage,
  timeoutMs,
}: UseAnalysisStatusPollingParams<TParams>) {
  const pollingStartedAtRef = useRef<number | null>(null);
  const pollingKey = useMemo(() => JSON.stringify(queryKey), [queryKey]);

  useEffect(() => {
    pollingStartedAtRef.current = null;
  }, [enabled, pollingKey]);

  return useQuery({
    queryKey,
    queryFn: () => {
      if (params === null) {
        throw new Error(invalidRouteMessage);
      }

      pollingStartedAtRef.current ??= Date.now();

      if (
        hasAnalysisPollingTimedOut({
          now: Date.now(),
          startedAt: pollingStartedAtRef.current,
          timeoutMs,
        })
      ) {
        throw new Error(timeoutMessage ?? invalidRouteMessage);
      }

      return fetchStatus(params);
    },
    enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;

      if (query.state.error || !status) return false;

      return shouldPollAnalysisStatus(status) ? intervalMs : false;
    },
  });
}

'use client';

import { useMutation } from '@tanstack/react-query';
import type { AnalysisStatusResponse } from '@/apis/analysis';
import { createPolledFetcher, useJobPoller } from './useJobPoller';

type UseAnalysisJobPhaseOptions<TVariables, TParams, TResponse, TResult> = {
  errorMessage: string;
  fetchResult: (params: TParams) => Promise<TResponse>;
  fetchStatus: (params: TParams) => Promise<AnalysisStatusResponse>;
  intervalMs: number;
  normalizeResult: (response: TResponse) => TResult;
  prepareParams: (variables: TVariables) => Promise<TParams> | TParams;
  timeoutMs: number;
};

export function useAnalysisJobPhase<TVariables, TParams, TResponse, TResult>({
  errorMessage,
  fetchResult,
  fetchStatus,
  intervalMs,
  normalizeResult,
  prepareParams,
  timeoutMs,
}: UseAnalysisJobPhaseOptions<TVariables, TParams, TResponse, TResult>) {
  const waitForSuccess = useJobPoller<TParams>(fetchStatus, {
    errorMessage,
    intervalMs,
    timeoutMs,
  });
  const getResultAfterPolling = createPolledFetcher(
    waitForSuccess,
    async (params: TParams) => normalizeResult(await fetchResult(params)),
  );

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const params = await prepareParams(variables);

      return getResultAfterPolling(params);
    },
  });
}

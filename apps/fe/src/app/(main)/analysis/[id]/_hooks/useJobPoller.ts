'use client';

import { useCallback } from 'react';
import type { AnalysisStatusResponse } from '@/apis/analysis';
import { waitForAnalysisJobSuccess } from '../_utils/analysisPolling';

type FetchStatus<TParams> = (
  params: TParams,
) => Promise<AnalysisStatusResponse>;

type UseJobPollerOptions = {
  errorMessage: string;
  intervalMs: number;
  timeoutMs: number;
};

export function useJobPoller<TParams>(
  fetchStatus: FetchStatus<TParams>,
  { errorMessage, intervalMs, timeoutMs }: UseJobPollerOptions,
) {
  return useCallback(
    async (params: TParams) => {
      await waitForAnalysisJobSuccess(fetchStatus, params, {
        errorMessage,
        intervalMs,
        timeoutMs,
      });
    },
    [errorMessage, fetchStatus, intervalMs, timeoutMs],
  );
}

export function createPolledFetcher<TParams, TResult>(
  waitForSuccess: (params: TParams) => Promise<void>,
  fetchResult: (params: TParams) => Promise<TResult>,
) {
  return async (params: TParams) => {
    await waitForSuccess(params);
    return fetchResult(params);
  };
}

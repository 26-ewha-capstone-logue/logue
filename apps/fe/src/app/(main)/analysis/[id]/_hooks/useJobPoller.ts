'use client';

import { useCallback } from 'react';
import type {
  AnalysisJobStatus,
  AnalysisStatusResponse,
} from '@/apis/analysis';

type FetchStatus<TParams> = (
  params: TParams,
) => Promise<AnalysisStatusResponse>;

type UseJobPollerOptions = {
  errorMessage: string;
  intervalMs: number;
  timeoutMs: number;
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function shouldPollJobStatus(status?: AnalysisJobStatus) {
  return (
    !status ||
    status === 'QUEUED' ||
    status === 'RUNNING' ||
    status === 'RETRYING'
  );
}

export function isFailedJobStatus(status?: AnalysisJobStatus) {
  return status === 'FAILED' || status === 'CANCELED' || status === 'CANCELLED';
}

export function useJobPoller<TParams>(
  fetchStatus: FetchStatus<TParams>,
  { errorMessage, intervalMs, timeoutMs }: UseJobPollerOptions,
) {
  return useCallback(
    async (params: TParams) => {
      const startedAt = Date.now();

      while (Date.now() - startedAt < timeoutMs) {
        const { status } = await fetchStatus(params);

        if (status === 'SUCCESS') return;
        if (isFailedJobStatus(status)) {
          throw new Error(errorMessage);
        }

        await wait(intervalMs);
      }

      throw new Error(errorMessage);
    },
    [errorMessage, fetchStatus, intervalMs, timeoutMs],
  );
}

'use client';

import { useCallback } from 'react';
import type {
  AnalysisJobStatus,
  AnalysisStatusResponse,
} from '@/apis/analysis';
import {
  isFailedAnalysisStatus,
  normalizeAnalysisStatusError,
  shouldPollAnalysisStatus,
} from '../_adapters/normalizeAnalysisError';

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
  return shouldPollAnalysisStatus(status);
}

export function isFailedJobStatus(status?: AnalysisJobStatus) {
  return isFailedAnalysisStatus(status);
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
          throw new Error(
            normalizeAnalysisStatusError(status, errorMessage)?.message ??
              errorMessage,
          );
        }

        await wait(intervalMs);
      }

      throw new Error(errorMessage);
    },
    [errorMessage, fetchStatus, intervalMs, timeoutMs],
  );
}

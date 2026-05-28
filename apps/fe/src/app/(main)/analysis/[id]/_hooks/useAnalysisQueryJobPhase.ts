'use client';

import { useQuery, type QueryKey } from '@tanstack/react-query';
import type { AnalysisStatusResponse } from '@/apis/analysis';
import {
  normalizeAnalysisError,
  normalizeAnalysisStatusError,
} from '../_adapters/normalizeAnalysisError';
import { isFailedAnalysisJobStatus } from '../_utils/analysisPolling';
import { useAnalysisStatusPolling } from './useAnalysisStatusPolling';

type UseAnalysisQueryJobPhaseOptions<TParams, TResponse, TResult> = {
  enabled: boolean;
  failedMessage: string;
  fetchResult: (params: TParams) => Promise<TResponse>;
  fetchStatus: (params: TParams) => Promise<AnalysisStatusResponse>;
  getResultErrorMessage: string;
  intervalMs: number;
  invalidRouteMessage: string;
  normalizeResult: (response: TResponse) => TResult;
  params: TParams | null;
  resultQueryKey: QueryKey;
  statusQueryKey: QueryKey;
};

export function useAnalysisQueryJobPhase<TParams, TResponse, TResult>({
  enabled,
  failedMessage,
  fetchResult,
  fetchStatus,
  getResultErrorMessage,
  intervalMs,
  invalidRouteMessage,
  normalizeResult,
  params,
  resultQueryKey,
  statusQueryKey,
}: UseAnalysisQueryJobPhaseOptions<TParams, TResponse, TResult>) {
  const statusQuery = useAnalysisStatusPolling<TParams>({
    enabled,
    fetchStatus,
    invalidRouteMessage,
    intervalMs,
    params,
    queryKey: statusQueryKey,
  });
  const status = enabled ? statusQuery.data?.status : undefined;
  const resultQuery = useQuery({
    queryKey: resultQueryKey,
    queryFn: () => {
      if (params === null) throw new Error(invalidRouteMessage);

      return fetchResult(params);
    },
    enabled: enabled && status === 'SUCCESS',
    select: normalizeResult,
  });
  const result = enabled ? resultQuery.data : undefined;
  const error = !enabled
    ? normalizeAnalysisError(
        new Error(invalidRouteMessage),
        invalidRouteMessage,
      )
    : statusQuery.isError
      ? normalizeAnalysisError(statusQuery.error, getResultErrorMessage)
      : resultQuery.isError
        ? normalizeAnalysisError(resultQuery.error, getResultErrorMessage)
        : normalizeAnalysisStatusError(status, failedMessage);
  const pending =
    enabled &&
    !statusQuery.isError &&
    !resultQuery.isError &&
    !result &&
    !isFailedAnalysisJobStatus(status);

  return {
    error,
    errorMessage: error?.message ?? null,
    pending,
    result,
    resultQuery,
    status,
    statusQuery,
  };
}

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

type AnalysisPollingOptions = {
  errorMessage: string;
  intervalMs: number;
  timeoutMs: number;
};

type RefetchIntervalParams = {
  hasError: boolean;
  intervalMs: number;
  status?: AnalysisJobStatus;
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function shouldPollAnalysisJobStatus(status?: AnalysisJobStatus) {
  return shouldPollAnalysisStatus(status);
}

export function isFailedAnalysisJobStatus(status?: AnalysisJobStatus) {
  return isFailedAnalysisStatus(status);
}

export function getAnalysisStatusRefetchInterval({
  hasError,
  intervalMs,
  status,
}: RefetchIntervalParams) {
  if (hasError || !status) return false;

  return shouldPollAnalysisJobStatus(status) ? intervalMs : false;
}

function getAnalysisJobStatusErrorMessage(
  status: AnalysisJobStatus | undefined,
  fallbackMessage: string,
) {
  return (
    normalizeAnalysisStatusError(status, fallbackMessage)?.message ??
    fallbackMessage
  );
}

export async function waitForAnalysisJobSuccess<TParams>(
  fetchStatus: FetchStatus<TParams>,
  params: TParams,
  { errorMessage, intervalMs, timeoutMs }: AnalysisPollingOptions,
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const { status } = await fetchStatus(params);

    if (status === 'SUCCESS') return;
    if (isFailedAnalysisJobStatus(status)) {
      throw new Error(getAnalysisJobStatusErrorMessage(status, errorMessage));
    }

    await wait(intervalMs);
  }

  throw new Error(errorMessage);
}

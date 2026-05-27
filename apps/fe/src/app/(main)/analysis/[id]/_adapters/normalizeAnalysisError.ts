import axios from 'axios';
import type { AnalysisJobStatus } from '@/apis/analysis';
import type {
  AnalysisUiStatus,
  UserFacingAnalysisError,
} from '../_models/analysisErrorTypes';

const ERROR_BY_CODE: Record<string, UserFacingAnalysisError> = {
  LLM_OUTPUT_INVALID: {
    code: 'LLM_OUTPUT_INVALID',
    title: '분석 응답을 해석하지 못했어요',
    message:
      'AI 분석 응답 형식이 올바르지 않아 결과를 표시할 수 없습니다. 다시 시도해 주세요.',
    retryable: false,
  },
  LLM_REFERENCE_VIOLATION: {
    code: 'LLM_REFERENCE_VIOLATION',
    title: '분석 기준이 데이터와 맞지 않아요',
    message:
      'AI가 데이터에 없는 기준을 참조했습니다. 질문을 조금 바꿔 다시 시도해 주세요.',
    retryable: false,
  },
  LLM_CALL_FAILED: {
    code: 'LLM_CALL_FAILED',
    title: 'AI 분석 호출에 실패했어요',
    message:
      '일시적인 AI 분석 호출 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    retryable: true,
  },
  FAILED: {
    code: 'FAILED',
    title: '분석에 실패했어요',
    message:
      '분석 작업이 실패했습니다. 파일과 질문을 확인한 뒤 다시 시도해 주세요.',
    retryable: true,
  },
  CANCELED: {
    code: 'CANCELED',
    title: '분석이 취소되었어요',
    message: '분석 작업이 취소되었습니다.',
    retryable: false,
  },
  UNKNOWN_STATUS: {
    code: 'UNKNOWN_STATUS',
    title: '분석 상태를 확인하지 못했어요',
    message: '예상하지 못한 분석 상태가 전달되었습니다. 다시 시도해 주세요.',
    retryable: true,
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function pickString(value: unknown, key: string) {
  if (!isRecord(value)) return null;
  const picked = value[key];
  return typeof picked === 'string' && picked.trim() ? picked.trim() : null;
}

function pickErrorPayload(value: unknown): unknown {
  if (!isRecord(value)) return value;
  const detail = value.detail;
  if (isRecord(detail)) return detail;
  return value;
}

function isApiResponseErrorLike(
  value: unknown,
): value is { response: unknown } {
  return (
    isRecord(value) && value.name === 'ApiResponseError' && 'response' in value
  );
}

function resolveErrorCode(value: unknown) {
  const payload = pickErrorPayload(value);
  return (
    pickString(payload, 'code') ??
    pickString(payload, 'error_code') ??
    pickString(payload, 'errorCode')
  );
}

function resolveErrorMessage(value: unknown) {
  const payload = pickErrorPayload(value);
  return pickString(payload, 'message') ?? pickString(value, 'message');
}

export function normalizeAnalysisError(
  error: unknown,
  fallbackMessage = '분석 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
): UserFacingAnalysisError {
  const payload = axios.isAxiosError(error)
    ? error.response?.data
    : isApiResponseErrorLike(error)
      ? error.response
      : error;
  const code = resolveErrorCode(payload) ?? 'UNKNOWN_ANALYSIS_ERROR';
  const known = ERROR_BY_CODE[code];

  if (known) {
    return {
      ...known,
      message: resolveErrorMessage(payload) ?? known.message,
    };
  }

  const message =
    resolveErrorMessage(payload) ??
    (error instanceof Error && error.message.trim()
      ? error.message
      : fallbackMessage);

  return {
    code,
    title: '분석 요청을 처리하지 못했어요',
    message,
    retryable: true,
  };
}

export function normalizeAnalysisStatus(
  status: AnalysisJobStatus | null | undefined,
): AnalysisUiStatus {
  if (!status) return 'idle';

  switch (status) {
    case 'QUEUED':
    case 'RUNNING':
    case 'RETRYING':
      return 'polling';
    case 'SUCCESS':
      return 'success';
    case 'FAILED':
      return 'failed';
    case 'CANCELED':
    case 'CANCELLED':
      return 'canceled';
    default:
      return 'failed';
  }
}

export function shouldPollAnalysisStatus(
  status: AnalysisJobStatus | null | undefined,
) {
  return normalizeAnalysisStatus(status) === 'polling' || !status;
}

export function isFailedAnalysisStatus(
  status: AnalysisJobStatus | null | undefined,
) {
  const normalized = normalizeAnalysisStatus(status);
  return normalized === 'failed' || normalized === 'canceled';
}

export function normalizeAnalysisStatusError(
  status: AnalysisJobStatus | null | undefined,
  fallbackMessage: string,
): UserFacingAnalysisError | null {
  const normalized = normalizeAnalysisStatus(status);
  if (normalized !== 'failed' && normalized !== 'canceled') return null;

  if (status === 'CANCELED' || status === 'CANCELLED') {
    return ERROR_BY_CODE.CANCELED;
  }

  if (status === 'FAILED') {
    return {
      ...ERROR_BY_CODE.FAILED,
      message: fallbackMessage || ERROR_BY_CODE.FAILED.message,
    };
  }

  return ERROR_BY_CODE.UNKNOWN_STATUS;
}

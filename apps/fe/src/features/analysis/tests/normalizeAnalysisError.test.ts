import { describe, expect, it } from 'vitest';
import {
  canceledStatusResponse,
  failedStatusResponse,
  llmCallFailedError,
  llmOutputInvalidError,
  requestValidationFailedError,
} from '../fixtures/analysis.fixtures';
import {
  normalizeAnalysisError,
  normalizeAnalysisStatus,
  normalizeAnalysisStatusError,
} from '../adapters/normalizeAnalysisError';

describe('normalizeAnalysisError', () => {
  it('normalizes LLM_OUTPUT_INVALID errors', () => {
    const error = normalizeAnalysisError(llmOutputInvalidError);

    expect(error).toMatchObject({
      code: 'LLM_OUTPUT_INVALID',
      retryable: false,
    });
  });

  it('normalizes LLM_CALL_FAILED errors', () => {
    const error = normalizeAnalysisError(llmCallFailedError);

    expect(error).toMatchObject({
      code: 'LLM_CALL_FAILED',
      retryable: true,
    });
  });

  it('normalizes AI request validation errors', () => {
    const error = normalizeAnalysisError(requestValidationFailedError);

    expect(error).toMatchObject({
      code: 'REQUEST_VALIDATION_FAILED',
      retryable: false,
    });
    expect(error.message).not.toBe('Invalid analysis criteria.');
    expect(error.message).toContain('입력값');
  });

  it('normalizes FAILED statuses to retryable user-facing errors', () => {
    const error = normalizeAnalysisStatusError(
      failedStatusResponse.status,
      '분석에 실패했습니다.',
    );

    expect(normalizeAnalysisStatus(failedStatusResponse.status)).toBe('failed');
    expect(error).toMatchObject({
      code: 'FAILED',
      retryable: true,
    });
  });

  it('normalizes CANCELED statuses to non-retryable canceled errors', () => {
    const error = normalizeAnalysisStatusError(
      canceledStatusResponse.status,
      '분석이 취소되었습니다.',
    );

    expect(normalizeAnalysisStatus(canceledStatusResponse.status)).toBe(
      'canceled',
    );
    expect(error).toMatchObject({
      code: 'CANCELED',
      retryable: false,
    });
  });

  it('normalizes CANCELLED alias statuses to non-retryable canceled errors', () => {
    const error = normalizeAnalysisStatusError(
      'CANCELLED',
      '분석이 취소되었습니다.',
    );

    expect(normalizeAnalysisStatus('CANCELLED')).toBe('canceled');
    expect(error).toMatchObject({
      code: 'CANCELED',
      retryable: false,
    });
  });

  it('treats unexpected status strings as failed status', () => {
    expect(normalizeAnalysisStatus('SOMETHING_NEW')).toBe('failed');
  });
});

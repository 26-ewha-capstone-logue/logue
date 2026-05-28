import { describe, expect, it } from 'vitest';
import {
  getApiErrorCode,
  getApiErrorStatus,
  isApiConflictError,
} from './errors';
import { ApiResponseError } from './types';

describe('API error helpers', () => {
  it('reads error codes from ApiResponseError envelopes', () => {
    const error = new ApiResponseError({
      success: false,
      code: 'D007',
      message: 'Data source is in use.',
    });

    expect(getApiErrorCode(error)).toBe('D007');
    expect(getApiErrorStatus(error)).toBeNull();
    expect(isApiConflictError(error)).toBe(true);
  });

  it('reads error codes and status from Axios errors', () => {
    const error = {
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          success: false,
          code: 'D007',
          message: 'Data source is in use.',
        },
      },
    };

    expect(getApiErrorCode(error)).toBe('D007');
    expect(getApiErrorStatus(error)).toBe(409);
    expect(isApiConflictError(error)).toBe(true);
  });

  it('treats HTTP 409 as a conflict even without an envelope code', () => {
    const error = {
      isAxiosError: true,
      response: {
        status: 409,
        data: {},
      },
    };

    expect(getApiErrorCode(error)).toBeNull();
    expect(getApiErrorStatus(error)).toBe(409);
    expect(isApiConflictError(error)).toBe(true);
  });
});

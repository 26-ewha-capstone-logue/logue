import { describe, expect, it } from 'vitest';
import { getTableMessage } from '../utils/tableMessage';

const BASE_PARAMS = {
  dataSourceCount: 1,
  emptyMessage: 'empty',
  errorMessage: 'error',
  hasAccessToken: true,
  isError: false,
  isLoading: false,
  loadingMessage: 'loading',
  loginRequiredMessage: 'login required',
  status: 'authenticated' as const,
};

describe('getTableMessage', () => {
  it('asks anonymous users to log in after auth initialization', () => {
    expect(
      getTableMessage({
        ...BASE_PARAMS,
        hasAccessToken: false,
        status: 'anonymous',
      }),
    ).toBe('login required');
  });

  it('prefers loading while auth or data sources are loading', () => {
    expect(
      getTableMessage({
        ...BASE_PARAMS,
        status: 'initializing',
      }),
    ).toBe('loading');
    expect(
      getTableMessage({
        ...BASE_PARAMS,
        isLoading: true,
      }),
    ).toBe('loading');
  });

  it('shows errors before the empty state', () => {
    expect(
      getTableMessage({
        ...BASE_PARAMS,
        dataSourceCount: 0,
        isError: true,
      }),
    ).toBe('error');
  });

  it('shows the empty message only when no higher priority state applies', () => {
    expect(
      getTableMessage({
        ...BASE_PARAMS,
        dataSourceCount: 0,
      }),
    ).toBe('empty');
  });

  it('returns null when rows can be rendered', () => {
    expect(getTableMessage(BASE_PARAMS)).toBeNull();
  });
});

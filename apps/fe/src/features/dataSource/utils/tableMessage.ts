import type { AuthStatus } from '@/lib/authSession';

export type GetTableMessageParams = {
  dataSourceCount: number;
  emptyMessage: string;
  errorMessage: string | null;
  hasAccessToken: boolean;
  isError: boolean;
  isLoading: boolean;
  loadingMessage: string;
  loginRequiredMessage: string;
  status: AuthStatus;
};

export function getTableMessage({
  dataSourceCount,
  emptyMessage,
  errorMessage,
  hasAccessToken,
  isError,
  isLoading,
  loadingMessage,
  loginRequiredMessage,
  status,
}: GetTableMessageParams) {
  if (!hasAccessToken && status !== 'initializing') {
    return loginRequiredMessage;
  }

  if (status === 'initializing' || isLoading) {
    return loadingMessage;
  }

  if (isError) {
    return errorMessage;
  }

  if (dataSourceCount === 0) {
    return emptyMessage;
  }

  return null;
}

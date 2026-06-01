import { getApiErrorMessage, isApiConflictError } from '@/apis/errors';

type DataSourceDeleteErrorMessages = {
  conflict: string;
  fallback: string;
};

export function getDataSourceErrorMessage(
  error: unknown,
  fallbackMessage: string,
) {
  return getApiErrorMessage(error, fallbackMessage);
}

export function getDataSourceDeleteErrorMessage(
  error: unknown,
  { conflict, fallback }: DataSourceDeleteErrorMessages,
) {
  return isApiConflictError(error)
    ? conflict
    : getDataSourceErrorMessage(error, fallback);
}

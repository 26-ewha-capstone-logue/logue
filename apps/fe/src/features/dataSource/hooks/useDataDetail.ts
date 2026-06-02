'use client';

import { useDataSourceDetail } from './useDataSourceDetail';

type UseDataDetailParams = {
  dataSourceId: number | null;
  enabled: boolean;
};

export function useDataDetail({ dataSourceId, enabled }: UseDataDetailParams) {
  const detailQuery = useDataSourceDetail(dataSourceId, { enabled });

  return {
    detail: detailQuery.data,
    isError: detailQuery.isError,
    isLoading: detailQuery.isLoading,
  };
}

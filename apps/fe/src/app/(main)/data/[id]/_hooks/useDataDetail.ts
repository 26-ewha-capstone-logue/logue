'use client';

import { useQuery } from '@tanstack/react-query';
import { dataSourceKeys } from '@/apis/datasource';
import { getDataSource } from '@/features/dataSource';

type UseDataDetailParams = {
  dataSourceId: number;
  enabled: boolean;
};

export function useDataDetail({ dataSourceId, enabled }: UseDataDetailParams) {
  const detailQuery = useQuery({
    queryKey: dataSourceKeys.detail(dataSourceId),
    queryFn: () => getDataSource(dataSourceId),
    enabled,
  });

  return {
    detail: detailQuery.data,
    isError: detailQuery.isError,
    isLoading: detailQuery.isLoading,
  };
}

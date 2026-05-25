'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  dataSourceKeys,
  getDataSources,
  type DataSourceSort,
} from '@/apis/datasource';
import { getApiErrorMessage } from '@/apis/errors';

const DATA_SOURCE_PAGE_SIZE = 20;

type UseDataSourceListParams = {
  enabled: boolean;
  fallbackErrorMessage: string;
  page: number;
  sort: DataSourceSort;
};

export function useDataSourceList({
  enabled,
  fallbackErrorMessage,
  page,
  sort,
}: UseDataSourceListParams) {
  const listParams = useMemo(
    () => ({ sort, page, size: DATA_SOURCE_PAGE_SIZE }),
    [page, sort],
  );

  const query = useQuery({
    queryKey: dataSourceKeys.list(listParams),
    queryFn: () => getDataSources(listParams),
    enabled,
  });

  return {
    ...query,
    dataSources: query.data?.dataSources ?? [],
    errorMessage: query.isError
      ? getApiErrorMessage(query.error, fallbackErrorMessage)
      : null,
  };
}

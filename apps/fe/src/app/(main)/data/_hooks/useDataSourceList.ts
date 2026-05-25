'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  dataSourceKeys,
  getDataSources,
  type DataSourceSort,
} from '@/apis/datasource';
import { getApiErrorMessage } from '@/apis/errors';
import { getMockDataSourceListResponse } from '@/apis/mockDataSource';

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
  const dataSources =
    query.data?.dataSources ??
    getMockDataSourceListResponse(listParams).dataSources;
  const hasDataSources = dataSources.length > 0;

  return {
    ...query,
    dataSources,
    isError: query.isError && !hasDataSources,
    isLoading: query.isLoading && !hasDataSources,
    errorMessage:
      query.isError && !hasDataSources
        ? getApiErrorMessage(query.error, fallbackErrorMessage)
        : null,
  };
}

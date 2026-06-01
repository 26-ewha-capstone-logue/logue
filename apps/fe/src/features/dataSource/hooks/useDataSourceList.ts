'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dataSourceKeys, type DataSourceSort } from '@/apis/datasource';
import { getDataSources } from '@/features/dataSource';
import type { MockDataSourceManager } from '@/features/mockDataSource';
import { getDataSourceErrorMessage } from '../utils/dataSourceErrorMessage';

const DATA_SOURCE_PAGE_SIZE = 20;

type UseDataSourceListParams = {
  enabled: boolean;
  fallbackErrorMessage: string;
  mockDataSource: Pick<
    MockDataSourceManager,
    'getFallbackListResponse' | 'getVisibleDataSources'
  >;
  page: number;
  sort: DataSourceSort;
};

export function useDataSourceList({
  enabled,
  fallbackErrorMessage,
  mockDataSource,
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
  const dataSources = useMemo(() => {
    const rawDataSources =
      query.data?.dataSources ??
      mockDataSource.getFallbackListResponse(listParams).dataSources;

    return mockDataSource.getVisibleDataSources(rawDataSources);
  }, [listParams, mockDataSource, query.data?.dataSources]);
  const hasDataSources = dataSources.length > 0;

  return {
    ...query,
    dataSources,
    isError: query.isError && !hasDataSources,
    isLoading: query.isLoading && !hasDataSources,
    errorMessage:
      query.isError && !hasDataSources
        ? getDataSourceErrorMessage(query.error, fallbackErrorMessage)
        : null,
  };
}

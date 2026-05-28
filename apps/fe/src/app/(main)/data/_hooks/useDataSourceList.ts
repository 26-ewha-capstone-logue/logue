'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dataSourceKeys, type DataSourceSort } from '@/apis/datasource';
import { getDataSources } from '@/apis/dataSourceRepository';
import { getApiErrorMessage } from '@/apis/errors';
import {
  filterVisibleMockDataSources,
  getMockDataSourceListResponse,
} from '@/apis/mockDataSource';

const DATA_SOURCE_PAGE_SIZE = 20;

type UseDataSourceListParams = {
  deletedMockDataSourceIds: ReadonlySet<number>;
  enabled: boolean;
  fallbackErrorMessage: string;
  page: number;
  sort: DataSourceSort;
};

export function useDataSourceList({
  deletedMockDataSourceIds,
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
  const dataSources = useMemo(() => {
    const rawDataSources =
      query.data?.dataSources ??
      getMockDataSourceListResponse(listParams).dataSources;

    return filterVisibleMockDataSources(
      rawDataSources,
      deletedMockDataSourceIds,
    );
  }, [deletedMockDataSourceIds, listParams, query.data?.dataSources]);
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

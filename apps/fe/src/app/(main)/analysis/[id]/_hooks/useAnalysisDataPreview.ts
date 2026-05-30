'use client';

import { useQuery } from '@tanstack/react-query';
import { dataSourceKeys, getDataSource } from '@/apis/datasource';
import { getApiErrorMessage } from '@/apis/errors';
import { createDataSourcePreviewTableModel } from '@/features/dataSource';

type UseAnalysisDataPreviewParams = {
  dataSourceId: number | null;
  enabled: boolean;
  errorMessage: string;
  invalidRouteMessage: string;
};

export function useAnalysisDataPreview({
  dataSourceId,
  enabled,
  errorMessage,
  invalidRouteMessage,
}: UseAnalysisDataPreviewParams) {
  const dataSourceQuery = useQuery({
    queryKey: dataSourceKeys.detail(dataSourceId ?? 0),
    queryFn: () => {
      if (dataSourceId === null) throw new Error(invalidRouteMessage);
      return getDataSource(dataSourceId);
    },
    enabled: enabled && dataSourceId !== null,
  });
  const previewTable = createDataSourcePreviewTableModel(
    dataSourceQuery.data?.preview,
  );

  return {
    dataSourceErrorMessage: dataSourceQuery.isError
      ? getApiErrorMessage(dataSourceQuery.error, errorMessage)
      : null,
    isDataSourceEmpty: enabled && dataSourceQuery.isSuccess && !previewTable,
    isDataSourceLoading: enabled && dataSourceQuery.isLoading,
    previewTable,
  };
}

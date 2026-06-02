'use client';

import { getApiErrorMessage } from '@/apis/errors';
import { createDataSourcePreviewTableModel } from '@/features/dataSource';
import { useDataSourceDetail } from '@/features/dataSource/hooks/useDataSourceDetail';

type UseAnalysisDataPreviewParams = {
  dataSourceId: number | null;
  enabled: boolean;
  errorMessage: string;
};

export function useAnalysisDataPreview({
  dataSourceId,
  enabled,
  errorMessage,
}: UseAnalysisDataPreviewParams) {
  const dataSourceQuery = useDataSourceDetail(dataSourceId, { enabled });
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

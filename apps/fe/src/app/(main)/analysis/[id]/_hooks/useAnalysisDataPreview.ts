'use client';

import { useQuery } from '@tanstack/react-query';
import {
  dataSourceKeys,
  getDataSource,
  type FilePreview,
} from '@/apis/datasource';
import { getApiErrorMessage } from '@/apis/errors';
import type { DataTableColumn } from '../_components/DataTablePreview';

function createPreviewTable(preview?: FilePreview | null) {
  if (!preview || preview.headers.length === 0) return null;

  const columns: DataTableColumn[] = preview.headers.map((header, index) => ({
    key: `col-${index}`,
    label: header || `컬럼 ${index + 1}`,
  }));
  const rows = preview.rows.map((row) =>
    columns.reduce<Record<string, string>>((acc, column, index) => {
      acc[column.key] = row[index] ?? '';
      return acc;
    }, {}),
  );

  return { columns, rows };
}

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
  const previewTable = createPreviewTable(dataSourceQuery.data?.preview);

  return {
    dataSourceErrorMessage: dataSourceQuery.isError
      ? getApiErrorMessage(dataSourceQuery.error, errorMessage)
      : null,
    isDataSourceEmpty: enabled && dataSourceQuery.isSuccess && !previewTable,
    isDataSourceLoading: enabled && dataSourceQuery.isLoading,
    previewTable,
  };
}

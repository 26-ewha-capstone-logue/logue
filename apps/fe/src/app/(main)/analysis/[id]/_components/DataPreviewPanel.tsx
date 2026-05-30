'use client';

import {
  DataSourcePreviewTable,
  type DataSourcePreviewTableModel,
} from '@/features/dataSource';
import LoadingDataPreview from './LoadingDataPreview';

type DataPreviewPanelProps = {
  errorMessage: string | null;
  isEmpty: boolean;
  isLoading: boolean;
  table: DataSourcePreviewTableModel | null;
};

export default function DataPreviewPanel({
  errorMessage,
  isEmpty,
  isLoading,
  table,
}: DataPreviewPanelProps) {
  if (table) {
    return <DataSourcePreviewTable table={table} variant="analysis" />;
  }

  if (isLoading) {
    return <LoadingDataPreview variant="loading" />;
  }

  if (errorMessage) {
    return <LoadingDataPreview message={errorMessage} variant="error" />;
  }

  if (isEmpty) {
    return <LoadingDataPreview variant="empty" />;
  }

  return <LoadingDataPreview />;
}

'use client';

import DataTablePreview, { type DataTableColumn } from './DataTablePreview';
import LoadingDataPreview from './LoadingDataPreview';

type PreviewTable = {
  columns: DataTableColumn[];
  rows: Record<string, string>[];
};

type DataPreviewPanelProps = {
  errorMessage: string | null;
  isEmpty: boolean;
  isLoading: boolean;
  table: PreviewTable | null;
};

export default function DataPreviewPanel({
  errorMessage,
  isEmpty,
  isLoading,
  table,
}: DataPreviewPanelProps) {
  if (table) {
    return <DataTablePreview columns={table.columns} rows={table.rows} />;
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

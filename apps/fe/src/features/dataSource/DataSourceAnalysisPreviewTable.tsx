import {
  DataSourcePreviewTableBase,
  DEFAULT_PREVIEW_TABLE_EMPTY_MESSAGE,
  DEFAULT_PREVIEW_TABLE_ROW_EMPTY_MESSAGE,
} from './DataSourcePreviewTableBase';
import {
  createDataSourcePreviewTableModel,
  type DataSourcePreviewTableModel,
} from './previewTable';
import type { FilePreview } from './types';

type DataSourceAnalysisPreviewTableProps = {
  emptyMessage?: string;
  preview?: FilePreview | null;
  rowEmptyMessage?: string;
  table?: DataSourcePreviewTableModel | null;
};

export function DataSourceAnalysisPreviewTable({
  emptyMessage = DEFAULT_PREVIEW_TABLE_EMPTY_MESSAGE,
  preview,
  rowEmptyMessage = DEFAULT_PREVIEW_TABLE_ROW_EMPTY_MESSAGE,
  table,
}: DataSourceAnalysisPreviewTableProps) {
  const tableModel = table ?? createDataSourcePreviewTableModel(preview);

  if (!tableModel) {
    return (
      <div className="flex h-full items-center justify-center text-body3 text-gray-600">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="scrollbar-hide h-full overflow-auto">
      <DataSourcePreviewTableBase
        table={tableModel}
        theadClassName="sticky top-0 z-10"
        headerClassName="border-b border-gray-300 bg-orange-100 px-16 py-12 text-left font-medium whitespace-nowrap text-gray-900"
        cellClassName="px-16 py-12 whitespace-nowrap text-gray-800"
        rowClassName="border-b border-gray-200 transition-colors hover:bg-orange-50"
        rowEmptyMessage={rowEmptyMessage}
      />
    </div>
  );
}

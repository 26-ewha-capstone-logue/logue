import { DATA_SOURCE_MESSAGES } from '@/constants/messages';
import { DataSourcePreviewTableBase } from './DataSourcePreviewTableBase';
import {
  createDataSourcePreviewTableModel,
  type DataSourcePreviewTableModel,
} from './previewTable';
import type { FilePreview } from './types';

type DataSourceDetailPreviewTableProps = {
  emptyMessage?: string;
  preview?: FilePreview | null;
  rowEmptyMessage?: string;
  table?: DataSourcePreviewTableModel | null;
  title?: string;
};

const DEFAULT_TITLE = 'CSV \uBBF8\uB9AC\uBCF4\uAE30';

export function DataSourceDetailPreviewTable({
  emptyMessage = DATA_SOURCE_MESSAGES.previewTableEmpty,
  preview,
  rowEmptyMessage = DATA_SOURCE_MESSAGES.previewTableRowEmpty,
  table,
  title = DEFAULT_TITLE,
}: DataSourceDetailPreviewTableProps) {
  const tableModel = table ?? createDataSourcePreviewTableModel(preview);

  if (!tableModel) {
    return (
      <div className="flex min-h-[28rem] flex-1 items-center justify-center rounded-8 border border-gray-300 bg-white text-body3 text-gray-600">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-hidden rounded-8 border border-gray-300 bg-white">
      <div className="border-b border-gray-200 bg-gray-100 px-16 py-12">
        <p className="text-body3 font-semibold text-gray-900">{title}</p>
      </div>
      <DataSourcePreviewTableBase
        table={tableModel}
        bodyWrapperClassName="max-h-[42rem] overflow-auto"
        headerClassName="whitespace-nowrap border-b border-gray-200 px-16 py-12 text-left font-semibold"
        headerRowClassName="bg-white text-gray-900"
        cellClassName="max-w-[24rem] truncate whitespace-nowrap px-16 py-12 text-gray-800"
        rowClassName="border-b border-gray-100"
        rowEmptyMessage={rowEmptyMessage}
        showCellTitle
      />
    </div>
  );
}

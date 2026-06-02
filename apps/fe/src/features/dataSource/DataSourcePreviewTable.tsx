'use client';

import {
  createDataSourcePreviewTableModel,
  type DataSourcePreviewTableModel,
} from './previewTable';
import type { FilePreview } from './types';

type DataSourcePreviewTableBaseProps = {
  bodyWrapperClassName?: string;
  cellClassName: string;
  headerClassName: string;
  headerRowClassName?: string;
  rowClassName: string;
  rowEmptyMessage: string;
  showCellTitle?: boolean;
  table: DataSourcePreviewTableModel;
  theadClassName?: string;
};

type DataSourceDetailPreviewTableProps = {
  emptyMessage?: string;
  preview?: FilePreview | null;
  rowEmptyMessage?: string;
  table?: DataSourcePreviewTableModel | null;
  title?: string;
};

type DataSourceAnalysisPreviewTableProps = {
  emptyMessage?: string;
  preview?: FilePreview | null;
  rowEmptyMessage?: string;
  table?: DataSourcePreviewTableModel | null;
};

const DEFAULT_EMPTY_MESSAGE =
  '\uBBF8\uB9AC\uBCF4\uAE30 \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.';
const DEFAULT_ROW_EMPTY_MESSAGE =
  '\uD45C\uC2DC\uD560 \uD589\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.';
const DEFAULT_TITLE = 'CSV \uBBF8\uB9AC\uBCF4\uAE30';

function DataSourcePreviewTableBase({
  bodyWrapperClassName,
  cellClassName,
  headerClassName,
  headerRowClassName,
  rowClassName,
  rowEmptyMessage,
  showCellTitle = false,
  table,
  theadClassName,
}: DataSourcePreviewTableBaseProps) {
  return (
    <div className={bodyWrapperClassName}>
      <table className="min-w-full border-collapse text-body4">
        <thead className={theadClassName}>
          <tr className={headerRowClassName}>
            {table.columns.map((column) => (
              <th key={column.key} className={headerClassName}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.length === 0 ? (
            <tr>
              <td
                colSpan={table.columns.length}
                className="px-16 py-32 text-center text-gray-600"
              >
                {rowEmptyMessage}
              </td>
            </tr>
          ) : (
            table.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowClassName}>
                {table.columns.map((column) => {
                  const cell = row[column.key] || '-';

                  return (
                    <td
                      key={column.key}
                      className={cellClassName}
                      title={showCellTitle ? cell : undefined}
                    >
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function DataSourceDetailPreviewTable({
  emptyMessage = DEFAULT_EMPTY_MESSAGE,
  preview,
  rowEmptyMessage = DEFAULT_ROW_EMPTY_MESSAGE,
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

export function DataSourceAnalysisPreviewTable({
  emptyMessage = DEFAULT_EMPTY_MESSAGE,
  preview,
  rowEmptyMessage = DEFAULT_ROW_EMPTY_MESSAGE,
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

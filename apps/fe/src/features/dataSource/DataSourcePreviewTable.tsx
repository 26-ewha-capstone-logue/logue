'use client';

import type { FilePreview } from '@/apis/datasource';
import {
  createDataSourcePreviewTableModel,
  type DataSourcePreviewTableModel,
} from './previewTable';

type DataSourcePreviewTableVariant = 'detail' | 'analysis';

type DataSourcePreviewTableProps = {
  emptyMessage?: string;
  preview?: FilePreview | null;
  rowEmptyMessage?: string;
  table?: DataSourcePreviewTableModel | null;
  title?: string;
  variant?: DataSourcePreviewTableVariant;
};

const DEFAULT_EMPTY_MESSAGE =
  '\uBBF8\uB9AC\uBCF4\uAE30 \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.';
const DEFAULT_ROW_EMPTY_MESSAGE =
  '\uD45C\uC2DC\uD560 \uD589\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.';
const DEFAULT_TITLE = 'CSV \uBBF8\uB9AC\uBCF4\uAE30';

function getContainerClassName(variant: DataSourcePreviewTableVariant) {
  return variant === 'analysis'
    ? 'scrollbar-hide h-full overflow-auto'
    : 'min-h-0 flex-1 overflow-hidden rounded-8 border border-gray-300 bg-white';
}

function getHeaderClassName(variant: DataSourcePreviewTableVariant) {
  return variant === 'analysis'
    ? 'border-b border-gray-300 bg-orange-100 px-16 py-12 text-left font-medium whitespace-nowrap text-gray-900'
    : 'whitespace-nowrap border-b border-gray-200 px-16 py-12 text-left font-semibold';
}

function getCellClassName(variant: DataSourcePreviewTableVariant) {
  return variant === 'analysis'
    ? 'px-16 py-12 whitespace-nowrap text-gray-800'
    : 'max-w-[24rem] truncate whitespace-nowrap px-16 py-12 text-gray-800';
}

function getBodyWrapperClassName(variant: DataSourcePreviewTableVariant) {
  return variant === 'analysis' ? '' : 'max-h-[42rem] overflow-auto';
}

function getEmptyClassName(variant: DataSourcePreviewTableVariant) {
  return variant === 'analysis'
    ? 'flex h-full items-center justify-center text-body3 text-gray-600'
    : 'flex min-h-[28rem] flex-1 items-center justify-center rounded-8 border border-gray-300 bg-white text-body3 text-gray-600';
}

export default function DataSourcePreviewTable({
  emptyMessage = DEFAULT_EMPTY_MESSAGE,
  preview,
  rowEmptyMessage = DEFAULT_ROW_EMPTY_MESSAGE,
  table,
  title = DEFAULT_TITLE,
  variant = 'detail',
}: DataSourcePreviewTableProps) {
  const tableModel = table ?? createDataSourcePreviewTableModel(preview);

  if (!tableModel) {
    return <div className={getEmptyClassName(variant)}>{emptyMessage}</div>;
  }

  return (
    <div className={getContainerClassName(variant)}>
      {variant === 'detail' && (
        <div className="border-b border-gray-200 bg-gray-100 px-16 py-12">
          <p className="text-body3 font-semibold text-gray-900">{title}</p>
        </div>
      )}
      <div className={getBodyWrapperClassName(variant)}>
        <table className="min-w-full border-collapse text-body4">
          <thead className={variant === 'analysis' ? 'sticky top-0 z-10' : ''}>
            <tr
              className={
                variant === 'analysis' ? undefined : 'bg-white text-gray-900'
              }
            >
              {tableModel.columns.map((column) => (
                <th key={column.key} className={getHeaderClassName(variant)}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableModel.rows.length === 0 ? (
              <tr>
                <td
                  colSpan={tableModel.columns.length}
                  className="px-16 py-32 text-center text-gray-600"
                >
                  {rowEmptyMessage}
                </td>
              </tr>
            ) : (
              tableModel.rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={
                    variant === 'analysis'
                      ? 'border-b border-gray-200 transition-colors hover:bg-orange-50'
                      : 'border-b border-gray-100'
                  }
                >
                  {tableModel.columns.map((column) => {
                    const cell = row[column.key] || '-';

                    return (
                      <td
                        key={column.key}
                        className={getCellClassName(variant)}
                        title={variant === 'detail' ? cell : undefined}
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
    </div>
  );
}

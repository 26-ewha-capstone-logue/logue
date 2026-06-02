import { DATA_SOURCE_MESSAGES } from '@/constants/messages';
import { DataSourcePreviewTableBase } from './DataSourcePreviewTableBase';
import {
  createDataSourcePreviewTableModel,
  type DataSourcePreviewTableModel,
} from './previewTable';
import type { FilePreview } from './types';

export type DataSourcePreviewTableVariant = 'analysis' | 'detail';

type DataSourcePreviewTableProps = {
  emptyMessage?: string;
  preview?: FilePreview | null;
  rowEmptyMessage?: string;
  table?: DataSourcePreviewTableModel | null;
  title?: string;
  variant: DataSourcePreviewTableVariant;
};

type DataSourcePreviewTableVariantConfig = {
  bodyWrapperClassName?: string;
  cellClassName: string;
  containerClassName: string;
  emptyClassName: string;
  headerClassName: string;
  headerRowClassName?: string;
  rowClassName: string;
  showCellTitle?: boolean;
  theadClassName?: string;
};

const DEFAULT_DETAIL_TITLE = 'CSV 미리보기';

const VARIANT_CONFIG: Record<
  DataSourcePreviewTableVariant,
  DataSourcePreviewTableVariantConfig
> = {
  analysis: {
    containerClassName: 'scrollbar-hide h-full overflow-auto',
    emptyClassName:
      'flex h-full items-center justify-center text-body3 text-gray-600',
    theadClassName: 'sticky top-0 z-10',
    headerClassName:
      'border-b border-gray-300 bg-orange-100 px-16 py-12 text-left font-medium whitespace-nowrap text-gray-900',
    cellClassName: 'px-16 py-12 whitespace-nowrap text-gray-800',
    rowClassName:
      'border-b border-gray-200 transition-colors hover:bg-orange-50',
  },
  detail: {
    containerClassName:
      'min-h-0 flex-1 overflow-hidden rounded-8 border border-gray-300 bg-white',
    emptyClassName:
      'flex min-h-[28rem] flex-1 items-center justify-center rounded-8 border border-gray-300 bg-white text-body3 text-gray-600',
    bodyWrapperClassName: 'max-h-[42rem] overflow-auto',
    headerClassName:
      'whitespace-nowrap border-b border-gray-200 px-16 py-12 text-left font-semibold',
    headerRowClassName: 'bg-white text-gray-900',
    cellClassName:
      'max-w-[24rem] truncate whitespace-nowrap px-16 py-12 text-gray-800',
    rowClassName: 'border-b border-gray-100',
    showCellTitle: true,
  },
};

export function DataSourcePreviewTable({
  emptyMessage = DATA_SOURCE_MESSAGES.previewTableEmpty,
  preview,
  rowEmptyMessage = DATA_SOURCE_MESSAGES.previewTableRowEmpty,
  table,
  title = DEFAULT_DETAIL_TITLE,
  variant,
}: DataSourcePreviewTableProps) {
  const tableModel = table ?? createDataSourcePreviewTableModel(preview);
  const config = VARIANT_CONFIG[variant];

  if (!tableModel) {
    const emptyContent = (
      <div className={config.emptyClassName}>{emptyMessage}</div>
    );

    if (variant === 'detail') {
      return (
        <div className={config.containerClassName}>
          <div className="border-b border-gray-200 bg-gray-100 px-16 py-12">
            <p className="text-body3 font-semibold text-gray-900">{title}</p>
          </div>
          {emptyContent}
        </div>
      );
    }

    return emptyContent;
  }

  const tableContent = (
    <DataSourcePreviewTableBase
      table={tableModel}
      bodyWrapperClassName={config.bodyWrapperClassName}
      theadClassName={config.theadClassName}
      headerClassName={config.headerClassName}
      headerRowClassName={config.headerRowClassName}
      cellClassName={config.cellClassName}
      rowClassName={config.rowClassName}
      rowEmptyMessage={rowEmptyMessage}
      showCellTitle={config.showCellTitle}
    />
  );

  if (variant === 'detail') {
    return (
      <div className={config.containerClassName}>
        <div className="border-b border-gray-200 bg-gray-100 px-16 py-12">
          <p className="text-body3 font-semibold text-gray-900">{title}</p>
        </div>
        {tableContent}
      </div>
    );
  }

  return <div className={config.containerClassName}>{tableContent}</div>;
}

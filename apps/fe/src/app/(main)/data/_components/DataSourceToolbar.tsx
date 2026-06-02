'use client';

import type { DataSourceSort } from '@/features/dataSource';
import SortDropdown, { type SortOption } from './SortDropdown';

type DataSourceToolbarProps = {
  deletePending: boolean;
  hasSelection: boolean;
  onDeleteClick: () => void;
  onSortChange: (next: DataSourceSort) => void;
  onUploadClick: () => void;
  sortKey: DataSourceSort;
  sortOptions: SortOption<DataSourceSort>[];
  uploadPending: boolean;
};

export default function DataSourceToolbar({
  deletePending,
  hasSelection,
  onDeleteClick,
  onSortChange,
  onUploadClick,
  sortKey,
  sortOptions,
  uploadPending,
}: DataSourceToolbarProps) {
  return (
    <div className="mb-16 flex items-center justify-between">
      <SortDropdown
        options={sortOptions}
        value={sortKey}
        onChange={onSortChange}
      />
      <div className="flex items-center gap-16">
        {hasSelection && (
          <button
            type="button"
            onClick={onDeleteClick}
            disabled={deletePending}
            className="text-body4 text-gray-700 underline underline-offset-2 hover:text-gray-900 disabled:cursor-not-allowed disabled:text-gray-400"
          >
            삭제하기
          </button>
        )}
        <button
          type="button"
          onClick={onUploadClick}
          disabled={uploadPending}
          className="rounded-full bg-orange-500 px-16 py-8 text-body4 font-medium text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          CSV 파일 업로드
        </button>
      </div>
    </div>
  );
}

'use client';

import ChatIcon from '@/assets/icons/chat.svg';
import TrashIcon from '@/assets/icons/trash.svg';
import {
  DataSourcePreviewTable,
  type FilePreview,
} from '@/features/dataSource';

export type DataChartCardProps = {
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  preview?: FilePreview | null;
  onChat?: () => void;
  onDelete?: () => void;
};

export default function DataChartCard({
  fileName,
  fileSize,
  uploadedAt,
  preview,
  onChat,
  onDelete,
}: DataChartCardProps) {
  return (
    <div className="mx-auto flex min-h-[50rem] w-full max-w-[130rem] flex-1 flex-col gap-16 rounded-12 border border-gray-300 p-24">
      <div className="flex items-start justify-between gap-16">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <p className="truncate text-body3 font-semibold text-gray-900">
            {fileName}
          </p>
          <p className="text-body4 text-gray-500">
            {fileSize} | {uploadedAt}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-12">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChat?.();
            }}
            className="inline-flex items-center gap-4 rounded-full bg-orange-500 px-12 py-8 text-body4 font-medium text-white transition-colors hover:bg-orange-600"
          >
            <ChatIcon aria-hidden className="icon-12 text-white" />
            <span>채팅</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            aria-label="삭제"
            className="text-gray-500 transition-colors hover:text-error-500"
          >
            <TrashIcon aria-hidden className="icon-16" />
          </button>
        </div>
      </div>

      <DataSourcePreviewTable preview={preview} variant="detail" />
    </div>
  );
}

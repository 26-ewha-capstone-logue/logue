'use client';

import type { FilePreview } from '@/apis/datasource';
import ChatIcon from '@/assets/icons/chat.svg';
import TrashIcon from '@/assets/icons/trash.svg';

export type DataChartCardProps = {
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  preview?: FilePreview | null;
  chatDisabled?: boolean;
  onChat?: () => void;
  onDelete?: () => void;
};

function DataPreviewTable({ preview }: { preview?: FilePreview | null }) {
  const headers = preview?.headers ?? [];
  const rows = preview?.rows ?? [];

  if (headers.length === 0) {
    return (
      <div className="flex min-h-[28rem] flex-1 items-center justify-center rounded-8 border border-gray-300 bg-white text-body3 text-gray-600">
        미리보기 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-hidden rounded-8 border border-gray-300 bg-white">
      <div className="border-b border-gray-200 bg-gray-100 px-16 py-12">
        <p className="text-body3 font-semibold text-gray-900">CSV 미리보기</p>
      </div>
      <div className="max-h-[42rem] overflow-auto">
        <table className="min-w-full border-collapse text-body4">
          <thead>
            <tr className="bg-white text-gray-900">
              {headers.map((header, index) => (
                <th
                  key={`${header}-${index}`}
                  className="whitespace-nowrap border-b border-gray-200 px-16 py-12 text-left font-semibold"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-16 py-32 text-center text-gray-600"
                >
                  표시할 행이 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-gray-100">
                  {headers.map((_, columnIndex) => {
                    const cell = row[columnIndex] ?? '-';

                    return (
                      <td
                        key={`${rowIndex}-${columnIndex}`}
                        className="max-w-[24rem] truncate whitespace-nowrap px-16 py-12 text-gray-800"
                        title={cell}
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

export default function DataChartCard({
  fileName,
  fileSize,
  uploadedAt,
  preview,
  chatDisabled = false,
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
            disabled={chatDisabled}
            onClick={(e) => {
              e.stopPropagation();
              onChat?.();
            }}
            className="inline-flex items-center gap-4 rounded-full bg-orange-500 px-12 py-8 text-body4 font-medium text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-400"
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

      <DataPreviewTable preview={preview} />
    </div>
  );
}

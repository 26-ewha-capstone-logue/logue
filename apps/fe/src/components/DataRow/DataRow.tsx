'use client';

export type DataRowProps = {
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  selected?: boolean;
  onSelect?: (checked: boolean) => void;
  onChat?: () => void;
  isHeader?: boolean;
};

export default function DataRow({
  fileName,
  fileSize,
  uploadedAt,
  selected = false,
  onSelect,
  onChat,
  isHeader = false,
}: DataRowProps) {
  if (isHeader) {
    return (
      <div className="flex items-center gap-16 border-b border-gray-400 bg-gray-200 px-24 py-12">
        <span className="w-24 shrink-0" />
        <span className="flex-1 text-body3 text-gray-800">파일명</span>
        <span className="w-[8rem] text-body3 text-gray-800">파일 크기</span>
        <span className="w-[10rem] text-body3 text-gray-800">최근 업로드</span>
        <span className="w-[8rem] text-right text-body3 text-gray-800">액션</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-16 border-b border-gray-300 px-24 py-16 transition-colors hover:bg-gray-100 ${
        selected ? 'bg-orange-100/20' : 'bg-white'
      }`}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={(e) => onSelect?.(e.target.checked)}
        className="h-20 w-20 shrink-0 cursor-pointer accent-orange-500"
      />
      <span className="flex-1 truncate text-body2 text-gray-900">{fileName}</span>
      <span className="w-[8rem] text-body2 text-gray-600">{fileSize}</span>
      <span className="w-[10rem] text-body2 text-gray-600">{uploadedAt}</span>
      <div className="flex w-[8rem] justify-end">
        <button
          type="button"
          onClick={onChat}
          className="inline-flex items-center gap-4 rounded-8 border border-gray-300 bg-white px-12 py-6 text-body4 font-semibold text-gray-800 transition-colors hover:border-orange-500 hover:text-orange-500"
        >
          🗨️ 채팅
        </button>
      </div>
    </div>
  );
}

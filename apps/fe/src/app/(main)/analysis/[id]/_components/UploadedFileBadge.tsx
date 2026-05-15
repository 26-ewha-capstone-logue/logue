export type UploadedFileBadgeProps = {
  fileName: string;
  /** 우하단에 표시되는 상태 텍스트 (기본: "uploaded") */
  status?: string;
};

export default function UploadedFileBadge({
  fileName,
  status = 'uploaded',
}: UploadedFileBadgeProps) {
  return (
    <div className="inline-flex max-w-sm flex-col items-end gap-4 rounded-12 bg-white px-16 py-12 shadow-[0_0.2rem_0.8rem_rgba(0,0,0,0.06)]">
      <span
        title={fileName}
        className="block max-w-full truncate text-body4 text-gray-900"
      >
        {fileName}
      </span>
      <div className="flex items-center gap-4">
        <span
          aria-hidden
          className="inline-block h-12 w-12 rounded-2 bg-orange-400"
        />
        <span className="text-body4 text-gray-500">{status}</span>
      </div>
    </div>
  );
}

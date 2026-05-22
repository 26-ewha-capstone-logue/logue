export type UploadedFileChipProps = {
  file: File;
  onRemove: () => void;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function UploadedFileChip({
  file,
  onRemove,
}: UploadedFileChipProps) {
  return (
    <div className="mt-12 flex items-center gap-8 rounded-12 bg-white px-16 py-12 shadow-[0_0.1rem_0.4rem_rgba(0,0,0,0.06)]">
      <span className="inline-block h-20 w-20 rounded-4 bg-orange-400" />
      <span className="text-body2 text-gray-900">{file.name}</span>
      <span className="text-body4 text-gray-600">
        ({formatFileSize(file.size)})
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-auto text-body4 text-gray-500 hover:text-error-500"
      >
        삭제
      </button>
    </div>
  );
}

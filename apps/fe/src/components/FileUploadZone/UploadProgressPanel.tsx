import type { ReactNode } from 'react';

type UploadProgressPanelProps = {
  fileName: string;
  onRemove?: () => void;
  progress: number;
  uploadIcon?: ReactNode;
};

const CSV_GRAPHIC_SRC = '/illusts/csv-graphic.svg';

function CloseIcon({ className = 'icon-20' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="m6 6 12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function UploadProgressPanel({
  fileName,
  onRemove,
  progress,
  uploadIcon,
}: UploadProgressPanelProps) {
  const normalizedProgress = Math.max(0, Math.min(progress, 100));

  return (
    <div className="relative h-[9.1rem] rounded-8 border-[1.5px] border-gray-400">
      <div className="absolute left-[0.95rem] top-[0.85rem]">
        {uploadIcon ?? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={CSV_GRAPHIC_SRC}
            alt=""
            aria-hidden
            className="h-[5.6rem] w-[4.8rem]"
          />
        )}
      </div>
      <p className="absolute left-[6.3rem] top-[1.15rem] max-w-[42rem] truncate text-body3 text-gray-900 opacity-80">
        {fileName}
      </p>
      <p className="absolute left-[6.4rem] top-[3.25rem] text-body4 text-gray-800 opacity-80">
        uploading...
      </p>
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-[1.3rem] top-[3.25rem] text-gray-800 hover:text-error-500"
        aria-label={'\uD30C\uC77C \uC81C\uAC70'}
      >
        <CloseIcon />
      </button>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={normalizedProgress}
        className="absolute bottom-[1.8rem] left-20 h-[0.6rem] w-[54rem] max-w-[calc(100%-6.8rem)] rounded-222 bg-gray-300"
      >
        <div
          className="h-full rounded-222 bg-orange-500"
          style={{ width: `${normalizedProgress}%` }}
        />
      </div>
    </div>
  );
}

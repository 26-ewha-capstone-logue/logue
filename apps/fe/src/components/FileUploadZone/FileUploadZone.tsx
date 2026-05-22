'use client';

import {
  useCallback,
  useRef,
  useState,
  type DragEvent,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

type FileUploadState = 'default' | 'drag' | 'upload';

export type FileUploadZoneProps = {
  accept?: string;
  validateFile?: (file: File) => string | null;
  onFileSelect?: (file: File) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
  state?: FileUploadState;
  title?: string;
  fileName?: string;
  progress?: number;
  onClose?: () => void;
  onRemove?: () => void;
  uploadIcon?: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onDrop' | 'onError'>;

const CSV_GRAPHIC_SRC = '/illusts/csv-graphic.svg';

function UploadIcon() {
  return (
    <span className="inline-flex h-[3rem] w-[3rem] items-center justify-center rounded-full bg-gray-400 text-white">
      <svg className="icon-20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 5v14M5 12h14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

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

export default function FileUploadZone({
  accept = '.csv',
  validateFile,
  onFileSelect,
  onError,
  disabled = false,
  state,
  title = 'CSV 파일 업로드',
  fileName = '유니커넥트_사업자등록증.csv',
  progress = 36,
  onClose,
  onRemove,
  uploadIcon,
  className = '',
  ...rest
}: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndEmit = useCallback(
    (file: File) => {
      const validationError = validateFile?.(file);
      if (validationError) {
        onError?.(validationError);
        return;
      }

      const extensions = accept.split(',').map((s) => s.trim().toLowerCase());
      const lowerFileName = file.name.toLowerCase();
      const valid = extensions.some((ext) => lowerFileName.endsWith(ext));
      if (!valid) {
        onError?.(`${extensions.join(', ')} 파일만 업로드할 수 있습니다.`);
        return;
      }
      onFileSelect?.(file);
    },
    [accept, onFileSelect, onError, validateFile],
  );

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!disabled) setIsDragOver(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) validateAndEmit(file);
    },
    [disabled, validateAndEmit],
  );

  const handleClick = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndEmit(file);
      e.target.value = '';
    },
    [validateAndEmit],
  );

  const visualState = state ?? (isDragOver ? 'drag' : 'default');
  const isUpload = visualState === 'upload';
  const isDrag = visualState === 'drag';

  return (
    <div
      className={`relative w-full max-w-[64.8rem] overflow-hidden rounded-16 bg-white px-20 pt-16 pb-20 ${
        isUpload ? 'h-[16.7rem]' : 'h-[25.8rem]'
      } ${disabled ? 'opacity-50' : ''} ${className}`.trim()}
      {...rest}
    >
      <div className="mb-12 flex items-center">
        <p className="text-head3 text-gray-900 opacity-80">{title}</p>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-[1.4rem] right-[1.5rem] flex h-28 w-28 items-center justify-center text-gray-800 hover:text-gray-900"
          aria-label="닫기"
        >
          <CloseIcon />
        </button>
      )}

      {isUpload ? (
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
            aria-label="파일 제거"
          >
            <CloseIcon />
          </button>
          <div className="absolute bottom-[1.8rem] left-20 h-[0.6rem] w-[54rem] max-w-[calc(100%-6.8rem)] rounded-222 bg-gray-300">
            <div
              className="h-full rounded-222 bg-orange-500"
              style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }}
            />
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={handleClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex h-[18.2rem] cursor-pointer flex-col items-center justify-center rounded-8 border-[1.5px] border-dashed transition-colors ${
            isDrag
              ? 'border-orange-500 bg-orange-100/30'
              : 'border-gray-400 hover:border-orange-500'
          } ${disabled ? 'cursor-not-allowed' : ''}`}
        >
          <UploadIcon />
          <p className="mt-8 text-body2 text-gray-900 opacity-70">
            파일 드롭하기
          </p>
          <p className="text-body4 text-gray-800 opacity-70">or</p>
          <button
            type="button"
            className="mt-4 rounded-222 bg-orange-500 px-12 py-8 text-body2 text-white"
          >
            파일 업로드
          </button>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        aria-label="파일 업로드"
      />
    </div>
  );
}

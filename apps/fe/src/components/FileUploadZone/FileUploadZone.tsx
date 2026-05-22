'use client';

import {
  useState,
  useRef,
  useCallback,
  type DragEvent,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

type FileUploadState = 'default' | 'drag' | 'upload';

export type FileUploadZoneProps = {
  /** 허용 확장자 (기본: .csv) */
  accept?: string;
  /** 파일 선택 완료 콜백 */
  onFileSelect?: (file: File) => void;
  /** 에러 콜백 (확장자 불일치 등) */
  onError?: (message: string) => void;
  /** 비활성화 */
  disabled?: boolean;
  state?: FileUploadState;
  title?: string;
  fileName?: string;
  progress?: number;
  onClose?: () => void;
  onRemove?: () => void;
  uploadIcon?: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onDrop' | 'onError'>;

function CsvIcon() {
  return (
    <svg
      width="48"
      height="56"
      viewBox="0 0 48 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="0"
        y="0"
        width="48"
        height="56"
        rx="6"
        fill="#FFA947"
        opacity="0.2"
      />
      <rect
        x="4"
        y="4"
        width="40"
        height="48"
        rx="4"
        fill="#FFA947"
        opacity="0.4"
      />
      <text
        x="24"
        y="34"
        textAnchor="middle"
        fontSize="14"
        fontWeight="700"
        fill="#FC8320"
        fontFamily="Pretendard, sans-serif"
      >
        CSV
      </text>
    </svg>
  );
}

function UploadIcon() {
  return (
    <span className="inline-flex h-[2.2rem] w-[2.2rem] items-center justify-center rounded-full bg-gray-400 text-white">
      <svg className="icon-16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 17V7m0 0L8 11m4-4 4 4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function CloseIcon() {
  return (
    <svg className="icon-20" viewBox="0 0 24 24" fill="none" aria-hidden>
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
      const extensions = accept.split(',').map((s) => s.trim().toLowerCase());
      const fileName = file.name.toLowerCase();
      const valid = extensions.some((ext) => fileName.endsWith(ext));
      if (!valid) {
        onError?.(`${extensions.join(', ')} 파일만 업로드할 수 있습니다.`);
        return;
      }
      onFileSelect?.(file);
    },
    [accept, onFileSelect, onError],
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
      className={`relative w-full max-w-[64.8rem] overflow-hidden rounded-16 bg-white p-20 ${
        isUpload ? 'h-[16.7rem]' : 'h-[25.8rem]'
      } ${disabled ? 'opacity-50' : ''} ${className}`.trim()}
      {...rest}
    >
      <div className="mb-12 flex items-center justify-between">
        <p className="text-head3 text-gray-900 opacity-80">{title}</p>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-gray-800 hover:text-gray-900"
            aria-label="닫기"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {isUpload ? (
        <div className="relative h-[9.1rem] rounded-8 border border-gray-400">
          <div className="absolute left-[0.95rem] top-[0.85rem]">
            {uploadIcon ?? <CsvIcon />}
          </div>
          <p className="absolute left-[6.7rem] top-[1.15rem] max-w-[42rem] truncate text-body3 text-gray-900 opacity-80">
            {fileName}
          </p>
          <p className="absolute left-[6.8rem] top-[3.25rem] text-body4 text-gray-800 opacity-80">
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
          <div className="absolute bottom-[1.85rem] left-[1.85rem] h-[0.6rem] w-[54rem] max-w-[calc(100%-6.8rem)] rounded-[22.2rem] bg-gray-300">
            <div
              className="h-full rounded-[22.2rem] bg-orange-500"
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
              ? 'border-orange-500'
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
            className="mt-4 rounded-[22.2rem] bg-orange-500 px-12 py-8 text-body2 text-white"
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

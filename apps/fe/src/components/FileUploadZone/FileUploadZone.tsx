'use client';

import type { HTMLAttributes, ReactNode } from 'react';
import UploadProgressPanel from './UploadProgressPanel';
import { useFileDropzone } from './useFileDropzone';

type FileUploadState = 'default' | 'drag' | 'upload';

export type FileUploadZoneProps = {
  accept?: string;
  disabled?: boolean;
  fileName?: string;
  onClose?: () => void;
  onError?: (message: string) => void;
  onFileSelect?: (file: File) => void;
  onRemove?: () => void;
  progress?: number;
  state?: FileUploadState;
  title?: string;
  uploadIcon?: ReactNode;
  validateFile?: (file: File) => string | null;
} & Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onDrop' | 'onError'>;

const DEFAULT_TITLE = 'CSV \uD30C\uC77C \uC5C5\uB85C\uB4DC';
const DEFAULT_FILE_NAME =
  '\uC720\uB2C8\uCEE4\uB128\uC2A4_\uC0AC\uC5C5\uC790\uB4F1\uB85D\uC99D.csv';

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
  title = DEFAULT_TITLE,
  fileName = DEFAULT_FILE_NAME,
  progress = 36,
  onClose,
  onRemove,
  uploadIcon,
  className = '',
  ...rest
}: FileUploadZoneProps) {
  const {
    handleClick,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleInputChange,
    inputRef,
    isDragOver,
  } = useFileDropzone({
    accept,
    disabled,
    onError,
    onFileSelect,
    validateFile,
  });

  const visualState = state ?? (isDragOver ? 'drag' : 'default');
  const isUpload = visualState === 'upload';
  const isDrag = visualState === 'drag';
  const outerBorderClass = disabled ? 'border-gray-300' : 'border-orange-500';
  const dropzoneBorderClass = disabled
    ? 'border-gray-300'
    : isDrag
      ? 'border-orange-500 bg-orange-100/30'
      : 'border-gray-400 hover:border-orange-500';

  return (
    <div
      className={`relative w-full max-w-[64.8rem] overflow-hidden rounded-16 bg-white px-20 pt-16 pb-20 ${
        isUpload ? 'h-[16.7rem]' : 'h-[25.8rem]'
      } border-2 ${outerBorderClass} ${disabled ? 'opacity-50' : ''} ${className}`.trim()}
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
          aria-label={'\uB2EB\uAE30'}
        >
          <CloseIcon />
        </button>
      )}

      {isUpload ? (
        <UploadProgressPanel
          fileName={fileName}
          onRemove={onRemove}
          progress={progress}
          uploadIcon={uploadIcon}
        />
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex h-[18.2rem] w-full cursor-pointer flex-col items-center justify-center rounded-8 border-[1.5px] border-dashed transition-colors ${dropzoneBorderClass} ${
            disabled ? 'cursor-not-allowed' : ''
          }`}
        >
          <UploadIcon />
          <p className="mt-8 text-body2 text-gray-900 opacity-70">
            {'\uD30C\uC77C \uB4DC\uB798\uADF8\uD558\uAE30'}
          </p>
          <p className="text-body4 text-gray-800 opacity-70">or</p>
          <span className="mt-4 rounded-222 bg-orange-500 px-12 py-8 text-body2 text-white">
            {'\uD30C\uC77C \uC5C5\uB85C\uB4DC'}
          </span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={handleInputChange}
        className="hidden"
        aria-label={'\uD30C\uC77C \uC5C5\uB85C\uB4DC'}
      />
    </div>
  );
}

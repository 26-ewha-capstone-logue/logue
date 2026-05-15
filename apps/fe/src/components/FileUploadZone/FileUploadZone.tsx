'use client';

import {
  useState,
  useRef,
  useCallback,
  type DragEvent,
  type HTMLAttributes,
} from 'react';

export type FileUploadZoneProps = {
  /** 허용 확장자 (기본: .csv) */
  accept?: string;
  /** 파일 선택 완료 콜백 */
  onFileSelect?: (file: File) => void;
  /** 에러 콜백 (확장자 불일치 등) */
  onError?: (message: string) => void;
  /** 비활성화 */
  disabled?: boolean;
} & Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onDrop' | 'onError'>;

const CSV_GRAPHIC_SRC = '/illusts/csv-graphic.svg';

export default function FileUploadZone({
  accept = '.csv',
  onFileSelect,
  onError,
  disabled = false,
  className = '',
  ...rest
}: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndEmit = useCallback(
    (file: File) => {
      const extensions = accept
        .split(',')
        .map((s) => s.trim().toLowerCase());
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

  return (
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
      className={`flex w-full cursor-pointer flex-col items-center gap-12 rounded-20 border-2 border-dashed px-32 py-40 transition-colors ${isDragOver ? 'border-orange-500 bg-orange-100/30' : 'border-gray-300 bg-gray-100'} ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-orange-400 hover:bg-orange-100/20'} ${className}`.trim()}
      {...rest}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={CSV_GRAPHIC_SRC}
        alt=""
        aria-hidden
        className="h-[12.7rem] w-[12.7rem]"
      />
      <div className="flex flex-col items-center gap-4">
        <p className="text-head4 font-semibold text-gray-900">
          CSV 파일을 업로드해주세요
        </p>
        <p className="text-body2 text-gray-600">
          드래그 &amp; 드롭을 통해 파일을 업로드 하고 대화를 시작해보세요.
        </p>
      </div>
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

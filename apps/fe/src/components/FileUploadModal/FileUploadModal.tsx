'use client';

import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import CancelIcon from '@/assets/icons/cancel.svg';
import PlusIcon from '@/assets/icons/plus.svg';
import Modal from '../Modal/Modal';

export type FileUploadModalProps = {
  open: boolean;
  onClose: () => void;
  onUpload?: (file: File) => void;
  /** 허용 확장자 (기본 .csv) */
  accept?: string;
};

type Stage = 'idle' | 'uploading';

// TODO: 실제 업로드 진행률은 API 진척률로 교체. 현재는 시뮬레이션용.
const SIM_TICK_MS = 200;
const SIM_INCREMENT = 10;

export default function FileUploadModal({
  open,
  onClose,
  onUpload,
  accept = '.csv',
}: FileUploadModalProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const reset = useCallback(() => {
    clearTimer();
    setStage('idle');
    setFile(null);
    setProgress(0);
    setIsDragOver(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const startUpload = useCallback(
    (selected: File) => {
      setFile(selected);
      setStage('uploading');
      setProgress(0);
      clearTimer();
      let p = 0;
      intervalRef.current = setInterval(() => {
        p += SIM_INCREMENT;
        setProgress(Math.min(p, 100));
        if (p >= 100) {
          clearTimer();
          onUpload?.(selected);
        }
      }, SIM_TICK_MS);
    },
    [onUpload],
  );

  const pickFile = () => inputRef.current?.click();

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) startUpload(f);
    e.target.value = '';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) startUpload(f);
  };

  const handleCancelFile = () => {
    clearTimer();
    setFile(null);
    setProgress(0);
    setStage('idle');
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="flex flex-col gap-20">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <h2 className="text-head4 font-semibold text-gray-900">
            CSV 파일 업로드
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="닫기"
            className="text-gray-500 transition-colors hover:text-gray-900"
          >
            <CancelIcon aria-hidden className="icon-20 text-gray-500" />
          </button>
        </div>

        {/* idle: 점선 dropzone / uploading: 파일 카드 */}
        {stage === 'idle' ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center gap-24 rounded-12 border-2 border-dashed px-40 py-20 transition-colors ${
              isDragOver
                ? 'border-orange-500 bg-orange-100/40'
                : 'border-gray-400 bg-white'
            }`}
          >
            <div className="flex h-40 w-40 items-center justify-center rounded-full bg-gray-300">
              <PlusIcon aria-hidden className="icon-20 text-gray-700" />
            </div>
            <div className="flex flex-col items-center gap-8">
              <p className="text-body2 text-gray-700">파일 드롭하기</p>
              <p className="text-body4 text-gray-500">or</p>
              <button
                type="button"
                onClick={pickFile}
                className="rounded-full bg-orange-500 px-20 py-8 text-body4 font-medium text-white transition-colors hover:bg-orange-600"
              >
                파일 업로드
              </button>
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
        ) : (
          <div className="flex flex-col gap-12 rounded-12 border border-gray-300 bg-white px-16 py-16">
            <div className="flex items-center gap-12">
              <CsvFileIcon />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="truncate text-body4 text-gray-900">
                  {file?.name}
                </span>
                <span className="text-body4 text-gray-500">
                  {progress >= 100
                    ? '업로드 완료'
                    : `업로드 중... ${progress}%`}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCancelFile}
                aria-label="업로드 취소"
                className="shrink-0 text-gray-500 transition-colors hover:text-error-500"
              >
                <CancelIcon aria-hidden className="icon-16 text-gray-500" />
              </button>
            </div>
            <div className="h-[0.6rem] w-full overflow-hidden rounded-full bg-gray-300">
              <div
                className="h-full rounded-full bg-orange-500 transition-[width] duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

/** 파일 카드 좌측의 작은 CSV 아이콘 */
function CsvFileIcon() {
  return (
    <div
      aria-hidden
      className="relative flex h-32 w-28 shrink-0 items-center justify-center rounded-4 bg-orange-400"
    >
      <span className="text-[0.9rem] font-bold text-white">CSV</span>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import FileUploadZone from '../FileUploadZone/FileUploadZone';
import Modal from '../Modal/Modal';

export type FileUploadModalProps = {
  open: boolean;
  onClose: () => void;
  onUpload?: (file: File) => void | Promise<void>;
  validateFile?: (file: File) => string | null;
  onError?: (message: string) => void;
  accept?: string;
};

type Stage = 'idle' | 'uploading';

const SIM_TICK_MS = 200;
const SIM_INCREMENT = 10;
const UPLOAD_MODAL_CONTENT_CLASS_NAME =
  'relative z-10 w-full max-w-[64.8rem] rounded-16 bg-transparent p-0 shadow-none';

export default function FileUploadModal({
  open,
  onClose,
  onUpload,
  validateFile,
  onError,
  accept = '.csv',
}: FileUploadModalProps) {
  const [stage, setStage] = useState<Stage>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setStage('idle');
    setFile(null);
    setProgress(0);
  }, [clearTimer]);

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
          setProgress(100);

          void Promise.resolve(onUpload?.(selected))
            .catch((error) => {
              onError?.(
                error instanceof Error
                  ? error.message
                  : '파일 업로드에 실패했습니다.',
              );
            })
            .finally(reset);
        }
      }, SIM_TICK_MS);
    },
    [clearTimer, onError, onUpload, reset],
  );

  const handleCancelFile = useCallback(() => {
    clearTimer();
    setFile(null);
    setProgress(0);
    setStage('idle');
  }, [clearTimer]);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      ariaLabel="CSV 파일 업로드"
      contentClassName={UPLOAD_MODAL_CONTENT_CLASS_NAME}
    >
      <FileUploadZone
        accept={accept}
        validateFile={validateFile}
        onError={onError}
        onFileSelect={startUpload}
        state={stage === 'uploading' ? 'upload' : undefined}
        fileName={file?.name}
        progress={progress}
        onClose={handleClose}
        onRemove={handleCancelFile}
      />
    </Modal>
  );
}

'use client';

import { useState, useCallback } from 'react';
import Modal from '../Modal/Modal';
import FileUploadZone from '../FileUploadZone/FileUploadZone';

export type FileUploadModalProps = {
  open: boolean;
  onClose: () => void;
  onUpload?: (file: File) => void;
};

export default function FileUploadModal({
  open,
  onClose,
  onUpload,
}: FileUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = useCallback(
    (selected: File) => {
      setFile(selected);
      setUploading(true);
      let p = 0;
      const interval = setInterval(() => {
        p += 10;
        setProgress(p);
        if (p >= 100) {
          clearInterval(interval);
          setUploading(false);
          onUpload?.(selected);
        }
      }, 200);
    },
    [onUpload],
  );

  const handleClose = useCallback(() => {
    setFile(null);
    setUploading(false);
    setProgress(0);
    onClose();
  }, [onClose]);

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="flex flex-col gap-16">
        <div className="flex items-center justify-between">
          <h2 className="text-head4 text-gray-900">CSV 파일 업로드</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-800"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {file ? (
          <div className="flex items-center gap-12 rounded-12 border border-gray-300 px-16 py-12">
            <span className="inline-block h-24 w-24 rounded-4 bg-orange-400" />
            <div className="flex flex-1 flex-col gap-4">
              <span className="truncate text-body2 text-gray-900">{file.name}</span>
              {uploading && (
                <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-orange-500 transition-[width] duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setProgress(0);
                setUploading(false);
              }}
              className="text-gray-500 hover:text-error-500"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        ) : (
          <FileUploadZone onFileSelect={handleFileSelect} />
        )}
      </div>
    </Modal>
  );
}

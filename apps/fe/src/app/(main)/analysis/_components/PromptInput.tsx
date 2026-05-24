'use client';

import { useCallback, useState } from 'react';
import { FileUploadZone, Modal, TextField } from '@/components';
import UploadedFileChip from './UploadedFileChip';

export type PromptInputValue = {
  prompt: string;
  file: File | null;
};

export type PromptInputProps = {
  /** textarea placeholder */
  placeholder?: string;
  validateFile?: (file: File) => string | null;
  submitDisabled?: boolean;
  showFileAttach?: boolean;
  /** 전송 콜백 */
  onSubmit?: (value: PromptInputValue) => void;
  /** 파일 업로드 에러 콜백 */
  onError?: (message: string) => void;
};

const DEFAULT_PLACEHOLDER =
  '이번달이랑 지난달 비교해서 지역별 매출 높은 순으로 5개 보여줘';

export default function PromptInput({
  placeholder = DEFAULT_PLACEHOLDER,
  validateFile,
  submitDisabled = false,
  showFileAttach = true,
  onSubmit,
  onError,
}: PromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [prevShowFileAttach, setPrevShowFileAttach] = useState(showFileAttach);

  const isSubmitDisabled = submitDisabled || prompt.trim().length === 0;

  if (prevShowFileAttach !== showFileAttach) {
    setPrevShowFileAttach(showFileAttach);
    if (!showFileAttach) {
      setIsUploadOpen(false);
      setFile(null);
    }
  }

  const handleSubmit = useCallback(() => {
    if (isSubmitDisabled) return;
    onSubmit?.({ prompt, file });
    setPrompt('');
  }, [file, isSubmitDisabled, onSubmit, prompt]);

  const handleFileSelect = useCallback((selected: File) => {
    setFile(selected);
    setIsUploadOpen(false);
  }, []);

  const handleFileError = useCallback(
    (message: string) => {
      onError?.(message);
    },
    [onError],
  );

  return (
    <div className="w-full">
      <TextField
        fullWidth
        value={prompt}
        placeholder={placeholder}
        submitDisabled={isSubmitDisabled}
        showFileAttach={showFileAttach}
        onChange={(e) => setPrompt(e.target.value)}
        onSubmit={handleSubmit}
        onFileAttach={() => setIsUploadOpen((prev) => !prev)}
      />

      {showFileAttach && (
        <Modal
          open={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          contentClassName="relative z-10 w-full max-w-[64.8rem] rounded-16 bg-transparent p-0 shadow-none"
        >
          <FileUploadZone
            validateFile={validateFile}
            onFileSelect={handleFileSelect}
            onError={handleFileError}
            onClose={() => setIsUploadOpen(false)}
          />
        </Modal>
      )}

      {showFileAttach && file && (
        <UploadedFileChip file={file} onRemove={() => setFile(null)} />
      )}
    </div>
  );
}

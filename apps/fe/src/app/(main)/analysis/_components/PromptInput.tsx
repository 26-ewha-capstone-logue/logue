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
  /** 전송 콜백 */
  onSubmit?: (value: PromptInputValue) => void;
  /** 파일 업로드 에러 콜백 */
  onError?: (message: string) => void;
};

const DEFAULT_PLACEHOLDER =
  '이번달이랑 지난달 비교해서 지역별 매출 높은 순으로 5개 보여줘';

export default function PromptInput({
  placeholder = DEFAULT_PLACEHOLDER,
  onSubmit,
  onError,
}: PromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const isSubmitDisabled = prompt.trim().length === 0;

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
        onChange={(e) => setPrompt(e.target.value)}
        onSubmit={handleSubmit}
        onFileAttach={() => setIsUploadOpen((prev) => !prev)}
      />

      <Modal open={isUploadOpen} onClose={() => setIsUploadOpen(false)}>
        <FileUploadZone
          onFileSelect={handleFileSelect}
          onError={handleFileError}
        />
      </Modal>

      {file && <UploadedFileChip file={file} onRemove={() => setFile(null)} />}
    </div>
  );
}

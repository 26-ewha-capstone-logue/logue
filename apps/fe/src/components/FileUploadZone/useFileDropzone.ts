import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';

type UseFileDropzoneParams = {
  accept: string;
  disabled: boolean;
  onError?: (message: string) => void;
  onFileSelect?: (file: File) => void;
  validateFile?: (file: File) => string | null;
};

const MULTIPLE_FILES_MESSAGE =
  '\uD30C\uC77C\uC740 \uD558\uB098\uB9CC \uC5C5\uB85C\uB4DC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.';

export function getAcceptTokens(accept: string) {
  return accept
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
}

function getAcceptErrorMessage(accept: string) {
  return `${getAcceptTokens(accept).join(', ')} \uD30C\uC77C\uB9CC \uC5C5\uB85C\uB4DC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.`;
}

export function matchesAcceptedFile(file: File, accept: string) {
  const tokens = getAcceptTokens(accept);
  if (tokens.length === 0) return true;

  const lowerFileName = file.name.toLowerCase();
  const lowerMimeType = file.type.toLowerCase();

  return tokens.some((token) => {
    if (token.startsWith('.')) return lowerFileName.endsWith(token);
    if (token.endsWith('/*')) {
      return lowerMimeType.startsWith(token.slice(0, -1));
    }

    return lowerMimeType === token;
  });
}

export function useFileDropzone({
  accept,
  disabled,
  onError,
  onFileSelect,
  validateFile,
}: UseFileDropzoneParams) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndEmit = useCallback(
    (file: File) => {
      const validationError = validateFile?.(file);
      if (validationError) {
        onError?.(validationError);
        return;
      }

      if (!matchesAcceptedFile(file, accept)) {
        onError?.(getAcceptErrorMessage(accept));
        return;
      }

      onFileSelect?.(file);
    },
    [accept, onFileSelect, onError, validateFile],
  );

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (!disabled) setIsDragOver(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback((event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLButtonElement>) => {
      event.preventDefault();
      setIsDragOver(false);
      if (disabled) return;

      if (event.dataTransfer.files.length > 1) {
        onError?.(MULTIPLE_FILES_MESSAGE);
        return;
      }

      const file = event.dataTransfer.files[0];
      if (file) validateAndEmit(file);
    },
    [disabled, onError, validateAndEmit],
  );

  const handleClick = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) validateAndEmit(file);
      event.target.value = '';
    },
    [validateAndEmit],
  );

  return {
    handleClick,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleInputChange,
    inputRef,
    isDragOver,
  };
}

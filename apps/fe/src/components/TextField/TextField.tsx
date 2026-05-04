import {
  forwardRef,
  useRef,
  useCallback,
  type TextareaHTMLAttributes,
  type ReactNode,
  type MouseEvent,
} from 'react';

export type TextFieldProps = {
  /** 파일 추가 버튼 클릭 콜백 */
  onFileAttach?: () => void;
  /** 전송 버튼 클릭 콜백 */
  onSubmit?: () => void;
  /** 전송 버튼 비활성화 (값이 비어있을 때 등) */
  submitDisabled?: boolean;
  /** 파일 추가 버튼 커스텀 아이콘 */
  fileIcon?: ReactNode;
  /** 파일 추가 버튼 텍스트 */
  fileLabel?: string;
  /** 전체 너비 */
  fullWidth?: boolean;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'children'>;

function SendIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M9 15V3m0 0l-5.5 5.5M9 3l5.5 5.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DefaultFileIcon() {
  return (
    <span className="inline-block h-[1.4rem] w-[1.4rem] shrink-0 rounded-[0.3rem] bg-mint-400" />
  );
}

const TextField = forwardRef<HTMLTextAreaElement, TextFieldProps>(
  function TextField(
    {
      onFileAttach,
      onSubmit,
      submitDisabled = false,
      fileIcon,
      fileLabel = '파일 추가하기',
      fullWidth = false,
      className = '',
      placeholder = '메시지를 입력하세요',
      rows = 1,
      ...rest
    },
    ref,
  ) {
    const innerRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) ?? innerRef;

    const handleContainerClick = useCallback(
      (e: MouseEvent<HTMLDivElement>) => {
        if (
          e.target === e.currentTarget ||
          (e.target as HTMLElement).closest('[data-toolbar]')
        )
          return;
        textareaRef.current?.focus();
      },
      [textareaRef],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
          e.preventDefault();
          if (!submitDisabled) onSubmit?.();
        }
        rest.onKeyDown?.(e);
      },
      [onSubmit, submitDisabled, rest],
    );

    return (
      <div
        onClick={handleContainerClick}
        className={`inline-flex cursor-text flex-col items-start gap-[1rem] rounded-20 bg-white p-[2.9rem_2.6rem] shadow-[0_0.2rem_1.2rem_rgba(0,0,0,0.06)] ${fullWidth ? 'w-full' : ''} ${className}`.trim()}
      >
        {/* textarea */}
        <textarea
          ref={textareaRef}
          rows={rows}
          placeholder={placeholder}
          className="w-full resize-none bg-transparent text-body1 text-gray-900 outline-none placeholder:text-gray-500"
          onKeyDown={handleKeyDown}
          {...rest}
        />

        {/* toolbar */}
        <div data-toolbar className="flex w-full items-center justify-between">
          {/* 파일 추가 버튼 */}
          <button
            type="button"
            onClick={onFileAttach}
            className="inline-flex items-center gap-[0.6rem] rounded-20 border border-gray-300 px-12 py-[0.6rem] text-body4 text-gray-700 transition-colors hover:bg-gray-100"
          >
            {fileIcon ?? <DefaultFileIcon />}
            {fileLabel}
          </button>

          {/* 전송 버튼 */}
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitDisabled}
            className="inline-flex h-[3.8rem] w-[3.8rem] shrink-0 items-center justify-center rounded-12 bg-orange-500 text-white transition-colors hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    );
  },
);

export default TextField;

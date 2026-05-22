import {
  forwardRef,
  useRef,
  useCallback,
  useImperativeHandle,
  useState,
  type TextareaHTMLAttributes,
  type ReactNode,
  type MouseEvent,
} from 'react';

type TextFieldSize = 'lg' | 'md';

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
  /** Figma text filed size */
  size?: TextFieldSize;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'children'>;

function ArrowUpIcon() {
  return (
    <svg
      className="icon-24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 19V5m0 0L6 11m6-6 6 6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="icon-24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DefaultFileIcon() {
  return (
    <span className="inline-block h-[1.4rem] w-[1.4rem] shrink-0 rounded-[0.2rem] bg-mint-400" />
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
      size = 'lg',
      className = '',
      placeholder = '메시지를 입력하세요',
      rows = 1,
      ...rest
    },
    ref,
  ) {
    const innerRef = useRef<HTMLTextAreaElement>(null);
    const [focused, setFocused] = useState(false);

    useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement);

    const handleContainerClick = useCallback(
      (e: MouseEvent<HTMLDivElement>) => {
        if (
          e.target === e.currentTarget ||
          (e.target as HTMLElement).closest('[data-toolbar]')
        )
          return;
        innerRef.current?.focus();
      },
      [],
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

    const hasValue = String(rest.value ?? rest.defaultValue ?? '').length > 0;
    const toneClass = hasValue
      ? 'text-gray-900'
      : focused
        ? 'text-gray-800'
        : 'text-gray-700 placeholder:text-gray-700';
    const isCompact = size === 'md';

    return (
      <div
        onClick={handleContainerClick}
        className={`inline-flex cursor-text bg-white ${
          isCompact
            ? 'min-w-[41.8rem] flex-row items-center rounded-16 px-24 py-12'
            : 'min-w-[29rem] flex-col items-start gap-[5.9rem] rounded-20 px-[2.6rem] py-[2.9rem]'
        } ${fullWidth ? 'w-full' : ''} ${className}`.trim()}
      >
        <textarea
          ref={innerRef}
          rows={rows}
          placeholder={placeholder}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          onKeyDown={handleKeyDown}
          className={`min-w-0 flex-1 resize-none bg-transparent outline-none ${
            isCompact ? 'text-body2' : 'text-head3'
          } ${toneClass}`}
          {...rest}
        />

        <div
          data-toolbar
          className={`flex shrink-0 items-center ${
            isCompact ? 'gap-[1rem]' : 'w-full justify-between'
          }`}
        >
          {isCompact ? (
            <button
              type="button"
              onClick={onFileAttach}
              aria-label={fileLabel}
              className="inline-flex h-[3.8rem] w-[3.8rem] items-center justify-center rounded-12 text-gray-900 transition-colors hover:bg-gray-300"
            >
              {fileIcon ?? <PlusIcon />}
            </button>
          ) : (
            <button
              type="button"
              onClick={onFileAttach}
              className="inline-flex items-center gap-2 rounded-[22.2rem] border border-gray-500 bg-white px-16 py-8 text-body1 text-gray-900 transition-colors hover:bg-gray-100"
            >
              {fileIcon ?? <DefaultFileIcon />}
              {fileLabel}
            </button>
          )}

          <button
            type="button"
            onClick={onSubmit}
            disabled={submitDisabled}
            aria-label="전송"
            className="inline-flex h-[3.8rem] w-[3.8rem] shrink-0 items-center justify-center rounded-12 bg-orange-500 text-white transition-colors hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600"
          >
            <ArrowUpIcon />
          </button>
        </div>
      </div>
    );
  },
);

export default TextField;

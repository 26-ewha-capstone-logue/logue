import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import ArrowUpIcon from '@/assets/icons/arrow-up.svg';
import PlusIcon from '@/assets/icons/plus.svg';

type TextFieldSize = 'lg' | 'md';

export type TextFieldProps = {
  onFileAttach?: () => void;
  onSubmit?: () => void;
  submitDisabled?: boolean;
  fileIcon?: ReactNode;
  fileLabel?: string;
  fullWidth?: boolean;
  size?: TextFieldSize;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'children'>;

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
      onKeyDown,
      onFocus,
      onBlur,
      value,
      defaultValue,
      ...textareaProps
    },
    ref,
  ) {
    const innerRef = useRef<HTMLTextAreaElement>(null);
    const [focused, setFocused] = useState(false);

    useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement, []);

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
        onKeyDown?.(e);
      },
      [onKeyDown, onSubmit, submitDisabled],
    );

    const hasValue = String(value ?? defaultValue ?? '').length > 0;
    const toneClass = hasValue
      ? 'text-gray-900'
      : focused
        ? 'text-gray-800'
        : 'text-gray-700 placeholder:text-gray-700';
    const isCompact = size === 'md';
    const submitToneClass = isCompact
      ? 'bg-orange-500 text-white hover:bg-orange-600'
      : hasValue
        ? 'bg-orange-400 text-white hover:bg-orange-500'
        : focused
          ? 'bg-orange-500 text-white hover:bg-orange-600'
          : 'bg-gray-300 text-gray-900 hover:bg-gray-400';

    return (
      <div
        onClick={handleContainerClick}
        className={`inline-flex cursor-text bg-white shadow-[0_0.2rem_1.2rem_rgba(0,0,0,0.06)] ${
          isCompact
            ? 'min-w-[41.8rem] flex-row items-center rounded-16 px-24 py-12'
            : 'min-w-[29rem] flex-col items-start gap-[5.9rem] rounded-20 px-[2.6rem] py-[2.9rem]'
        } ${fullWidth ? 'w-full' : ''} ${className}`.trim()}
      >
        <textarea
          ref={innerRef}
          rows={rows}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          onKeyDown={handleKeyDown}
          className={`scrollbar-hide min-w-0 flex-1 resize-none bg-transparent outline-none ${
            isCompact ? 'text-body2' : 'text-head3'
          } ${toneClass}`}
          {...textareaProps}
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
              {fileIcon ?? (
                <PlusIcon aria-hidden className="icon-24 text-gray-900" />
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onFileAttach}
              className="inline-flex items-center gap-2 rounded-222 border border-gray-500 bg-white px-16 py-8 text-body1 text-gray-900 transition-colors hover:bg-gray-100"
            >
              {fileIcon ?? (
                <PlusIcon aria-hidden className="icon-16 text-gray-800" />
              )}
              {fileLabel}
            </button>
          )}

          <button
            type="button"
            onClick={onSubmit}
            disabled={submitDisabled}
            aria-label="전송"
            className={`inline-flex h-[3.8rem] w-[3.8rem] shrink-0 items-center justify-center rounded-12 transition-colors disabled:cursor-not-allowed disabled:bg-gray-400 disabled:text-gray-600 ${submitToneClass}`}
          >
            <ArrowUpIcon aria-hidden className="icon-20" />
          </button>
        </div>
      </div>
    );
  },
);

export default TextField;

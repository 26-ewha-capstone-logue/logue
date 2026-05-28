import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
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
  showFileAttach?: boolean;
  fileIcon?: ReactNode;
  fileLabel?: string;
  fullWidth?: boolean;
  size?: TextFieldSize;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'children'>;

function getSubmitToneClass(
  isCompact: boolean,
  hasValue: boolean,
  focused: boolean,
) {
  if (isCompact) return 'bg-orange-500 text-white hover:bg-orange-600';
  if (hasValue) return 'bg-orange-400 text-white hover:bg-orange-500';
  if (focused) return 'bg-orange-500 text-white hover:bg-orange-600';
  return 'bg-gray-300 text-gray-900 hover:bg-gray-400';
}

const TextField = forwardRef<HTMLTextAreaElement, TextFieldProps>(
  function TextField(
    {
      onFileAttach,
      onSubmit,
      submitDisabled = false,
      showFileAttach = true,
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
      onChange,
      value,
      defaultValue,
      ...textareaProps
    },
    ref,
  ) {
    const innerRef = useRef<HTMLTextAreaElement>(null);
    const [focused, setFocused] = useState(false);
    const [internalHasValue, setInternalHasValue] = useState(
      () => String(defaultValue ?? '').length > 0,
    );
    const isControlled = value !== undefined;

    useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement, []);

    const handleContainerClick = useCallback(
      (e: MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('[data-toolbar]')) return;
        innerRef.current?.focus();
      },
      [],
    );

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
          e.preventDefault();
          e.currentTarget.select();
          onKeyDown?.(e);
          return;
        }

        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
          e.preventDefault();
          if (!submitDisabled) onSubmit?.();
        }
        onKeyDown?.(e);
      },
      [onKeyDown, onSubmit, submitDisabled],
    );

    const handleChange = useCallback(
      (e: ChangeEvent<HTMLTextAreaElement>) => {
        if (!isControlled) {
          setInternalHasValue(e.currentTarget.value.length > 0);
        }
        onChange?.(e);
      },
      [isControlled, onChange],
    );

    const hasValue = isControlled ? String(value).length > 0 : internalHasValue;
    const toneClass = hasValue
      ? 'text-gray-900'
      : focused
        ? 'text-gray-800'
        : 'text-gray-700 placeholder:text-gray-700';
    const isCompact = size === 'md';
    const submitToneClass = getSubmitToneClass(isCompact, hasValue, focused);

    return (
      <div
        onClick={handleContainerClick}
        className={`inline-flex cursor-text bg-white shadow-[0_0.2rem_1.2rem_rgba(0,0,0,0.06)] ${
          isCompact
            ? 'min-w-[41.8rem] flex-row items-center rounded-16 px-24 py-12'
            : 'w-[115.5rem] max-w-full flex-col items-start gap-[5.9rem] rounded-20 px-[2.6rem] py-[2.9rem]'
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
          onChange={handleChange}
          className={`scrollbar-hide min-w-0 w-full flex-1 resize-none bg-transparent outline-none ${
            isCompact ? 'text-body2' : 'text-body1'
          } ${toneClass}`}
          {...textareaProps}
        />

        <div
          data-toolbar
          className={`flex shrink-0 items-center ${
            isCompact
              ? 'gap-[1rem]'
              : showFileAttach
                ? 'w-full justify-between'
                : 'w-full justify-end'
          }`}
        >
          {showFileAttach && isCompact ? (
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
          ) : showFileAttach ? (
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
          ) : null}

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

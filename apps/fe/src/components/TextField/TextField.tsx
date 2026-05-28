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
import {
  getFileAttachButtonClass,
  getSubmitButtonClass,
  getTextFieldContainerClass,
  getTextFieldTextareaClass,
  getTextFieldToolbarClass,
  getTextFieldVariant,
  type TextFieldSize,
  type TextFieldVariant,
} from './textFieldStyles';

export type TextFieldProps = {
  onFileAttach?: () => void;
  onSubmit?: () => void;
  submitDisabled?: boolean;
  showFileAttach?: boolean;
  fileIcon?: ReactNode;
  fileLabel?: string;
  fullWidth?: boolean;
  size?: TextFieldSize;
  variant?: TextFieldVariant;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'children'>;

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
      variant,
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
    const textFieldVariant = getTextFieldVariant({ size, variant });
    const isCompact = textFieldVariant === 'compact';

    return (
      <div
        onClick={handleContainerClick}
        className={getTextFieldContainerClass({
          className,
          fullWidth,
          variant: textFieldVariant,
        })}
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
          className={getTextFieldTextareaClass({
            focused,
            hasValue,
            variant: textFieldVariant,
          })}
          {...textareaProps}
        />

        <div
          data-toolbar
          className={getTextFieldToolbarClass({
            showFileAttach,
            variant: textFieldVariant,
          })}
        >
          {showFileAttach && isCompact ? (
            <button
              type="button"
              onClick={onFileAttach}
              aria-label={fileLabel}
              className={getFileAttachButtonClass(textFieldVariant)}
            >
              {fileIcon ?? (
                <PlusIcon aria-hidden className="icon-24 text-gray-900" />
              )}
            </button>
          ) : showFileAttach ? (
            <button
              type="button"
              onClick={onFileAttach}
              className={getFileAttachButtonClass(textFieldVariant)}
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
            className={getSubmitButtonClass({
              focused,
              hasValue,
              variant: textFieldVariant,
            })}
          >
            <ArrowUpIcon aria-hidden className="icon-20" />
          </button>
        </div>
      </div>
    );
  },
);

export default TextField;

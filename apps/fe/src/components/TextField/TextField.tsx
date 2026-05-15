import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  type MouseEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import ArrowUpIcon from '@/assets/icons/arrow-up.svg';
import PlusIcon from '@/assets/icons/plus.svg';

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
    // 내부에서는 항상 안전한 RefObject 를 들고 있고, 외부 ref(callback/RefObject)
    // 는 useImperativeHandle 로 동일한 인스턴스를 노출시켜 양쪽이 모두 동작하도록 함.
    const innerRef = useRef<HTMLTextAreaElement>(null);
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
        rest.onKeyDown?.(e);
      },
      [onSubmit, submitDisabled, rest],
    );

    return (
      <div
        onClick={handleContainerClick}
        className={`inline-flex cursor-text flex-col items-start gap-[3.8rem] rounded-20 bg-white p-[2.9rem_2.6rem] shadow-[0_0.2rem_1.2rem_rgba(0,0,0,0.06)] ${fullWidth ? 'w-full' : ''} ${className}`.trim()}
      >
        {/* textarea */}
        <textarea
          ref={innerRef}
          rows={rows}
          placeholder={placeholder}
          className="scrollbar-hide w-full resize-none bg-transparent text-body1 text-gray-900 outline-none placeholder:text-gray-500"
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
            {fileIcon ?? (
              <PlusIcon aria-hidden className="icon-16 text-gray-800" />
            )}
            {fileLabel}
          </button>

          {/* 전송 버튼 */}
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitDisabled}
            className="inline-flex h-[3.8rem] w-[3.8rem] shrink-0 items-center justify-center rounded-12 bg-orange-500 transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            <ArrowUpIcon aria-hidden className="icon-20 text-[#000000]" />
          </button>
        </div>
      </div>
    );
  },
);

export default TextField;

'use client';

import {
  forwardRef,
  useEffect,
  useRef,
  type InputHTMLAttributes,
  type MutableRefObject,
  type Ref,
} from 'react';

export type CheckboxProps = {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  indeterminate?: boolean;
  size?: 'sm' | 'md';
} & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'children' | 'checked' | 'onChange' | 'size' | 'type'
>;

const sizeClass = {
  sm: 'h-16 w-16',
  md: 'h-20 w-20',
} satisfies Record<NonNullable<CheckboxProps['size']>, string>;

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (!ref) return;

  if (typeof ref === 'function') {
    ref(value);
    return;
  }

  (ref as MutableRefObject<T | null>).current = value;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  {
    checked = false,
    indeterminate = false,
    onCheckedChange,
    size = 'sm',
    disabled,
    className = '',
    ...rest
  },
  ref,
) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isIndeterminate = indeterminate && !checked;

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  return (
    <label
      className={`inline-flex shrink-0 items-center justify-center ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      } ${className}`.trim()}
    >
      <input
        ref={(node) => {
          inputRef.current = node;
          assignRef(ref, node);
        }}
        type="checkbox"
        checked={checked}
        aria-checked={isIndeterminate ? 'mixed' : checked}
        disabled={disabled}
        onChange={(event) => onCheckedChange?.(event.target.checked)}
        className="peer sr-only"
        {...rest}
      />
      <span
        aria-hidden
        className={`inline-flex items-center justify-center rounded-2 transition-colors ${
          checked || isIndeterminate
            ? 'bg-orange-500'
            : 'border border-gray-400 bg-white'
        } ${sizeClass[size]}`}
      >
        {checked && !isIndeterminate && (
          <svg
            width="12"
            height="10"
            viewBox="0 0 12 10"
            fill="none"
            aria-hidden
            className="h-[1.1rem] w-[1.1rem]"
          >
            <path
              d="M1 5.2 4.4 8.5 11 1"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {isIndeterminate && (
          <span className="h-[0.2rem] w-10 rounded-full bg-white" />
        )}
      </span>
    </label>
  );
});

export default Checkbox;

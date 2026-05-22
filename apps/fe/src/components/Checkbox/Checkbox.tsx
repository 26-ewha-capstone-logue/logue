'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';

export type CheckboxProps = {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  size?: 'sm' | 'md';
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onChange'>;

const sizeClass = {
  sm: 'h-16 w-16',
  md: 'h-20 w-20',
} satisfies Record<NonNullable<CheckboxProps['size']>, string>;

const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox(
  {
    checked = false,
    onCheckedChange,
    size = 'sm',
    disabled,
    className = '',
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => {
        if (!disabled) onCheckedChange?.(!checked);
      }}
      className={`inline-flex shrink-0 items-center justify-center rounded-2 transition-colors ${
        checked ? 'bg-orange-500' : 'border border-gray-400 bg-white'
      } ${sizeClass[size]} ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${className}`.trim()}
      {...rest}
    >
      {checked && (
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
    </button>
  );
});

export default Checkbox;

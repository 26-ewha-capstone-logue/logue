'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';

export type RadioProps = {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onChange'>;

const Radio = forwardRef<HTMLButtonElement, RadioProps>(function Radio(
  {
    checked = false,
    onCheckedChange,
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
      role="radio"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => {
        if (!disabled) onCheckedChange?.(!checked);
      }}
      className={`inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-[0.8rem] border-[1.5px] transition-colors ${
        checked ? 'border-orange-500' : 'border-gray-400 bg-white'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${className}`.trim()}
      {...rest}
    >
      {checked && <span className="h-8 w-8 rounded-4 bg-orange-500" />}
    </button>
  );
});

export default Radio;

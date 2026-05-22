'use client';

import { type ButtonHTMLAttributes, type InputHTMLAttributes } from 'react';

type KeywordInputWidth = 'sm' | 'lg';
type KeywordInputMode = 'text' | 'radio' | 'checkbox';

export type KeywordInputProps = {
  width?: KeywordInputWidth;
  selected?: boolean;
  onSelect?: () => void;
  children?: string;
  /** @deprecated Figma design system uses the button variant. */
  mode?: KeywordInputMode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> &
  Pick<InputHTMLAttributes<HTMLInputElement>, 'placeholder'>;

export default function KeywordInput({
  width = 'lg',
  selected = false,
  onSelect,
  children,
  className = '',
  value,
  mode,
  placeholder = '키워드입력',
  ...rest
}: KeywordInputProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={
        mode === 'radio' || mode === 'checkbox' ? selected : undefined
      }
      className={`flex h-[4.5rem] items-center justify-center rounded-8 border bg-white px-16 text-head4 text-gray-900 transition-colors ${
        selected ? 'border-orange-500' : 'border-gray-300 hover:border-gray-400'
      } ${width === 'sm' ? 'w-[24.6rem]' : 'w-[53.2rem]'} ${className}`.trim()}
      {...rest}
    >
      {children ?? value ?? placeholder}
    </button>
  );
}

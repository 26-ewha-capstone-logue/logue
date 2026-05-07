'use client';

import { type InputHTMLAttributes } from 'react';

type KeywordInputMode = 'text' | 'radio' | 'checkbox';

export type KeywordInputProps = {
  mode?: KeywordInputMode;
  selected?: boolean;
  onSelect?: () => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export default function KeywordInput({
  mode = 'text',
  selected = false,
  onSelect,
  className = '',
  ...rest
}: KeywordInputProps) {
  const isSelectable = mode === 'radio' || mode === 'checkbox';
  const isActive = isSelectable && selected;

  return (
    <label
      className={`flex cursor-pointer items-center gap-12 rounded-12 border px-16 py-12 transition-colors ${
        isActive
          ? 'border-orange-500 bg-white'
          : 'border-gray-300 bg-gray-100 hover:border-gray-400'
      } ${className}`.trim()}
    >
      {isActive && (
        <span className="h-full w-4 shrink-0 rounded-full bg-orange-500" />
      )}
      <input
        type={mode === 'text' ? 'text' : 'text'}
        readOnly={isSelectable}
        className="flex-1 bg-transparent text-body2 text-gray-900 outline-none placeholder:text-gray-500"
        onClick={isSelectable ? onSelect : undefined}
        {...rest}
      />
      {mode === 'radio' && (
        <span
          className={`inline-flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 ${
            selected ? 'border-orange-500' : 'border-gray-400'
          }`}
        >
          {selected && <span className="h-12 w-12 rounded-full bg-orange-500" />}
        </span>
      )}
      {mode === 'checkbox' && (
        <span
          className={`inline-flex h-20 w-20 shrink-0 items-center justify-center rounded-4 border-2 ${
            selected
              ? 'border-orange-500 bg-orange-500'
              : 'border-gray-400 bg-white'
          }`}
        >
          {selected && (
            <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden>
              <path
                d="M1 5l3.5 3.5L11 1"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
      )}
    </label>
  );
}

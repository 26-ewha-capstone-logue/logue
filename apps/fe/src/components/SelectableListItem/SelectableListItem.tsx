'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import Checkbox from '../Checkbox/Checkbox';
import Radio from '../Radio/Radio';

export type SelectableListItemProps = {
  label: string;
  selected?: boolean;
  type?: 'checkbox' | 'radio';
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'type'>;

const SelectableListItem = forwardRef<
  HTMLButtonElement,
  SelectableListItemProps
>(function SelectableListItem(
  {
    label,
    selected = false,
    type = 'checkbox',
    disabled,
    className = '',
    ...rest
  },
  ref,
) {
  const Control = type === 'radio' ? Radio : Checkbox;

  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      className={`flex w-[16.9rem] items-center gap-[1rem] rounded-[0.6rem] px-[1rem] py-8 text-left transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50 ${className}`.trim()}
      {...rest}
    >
      <Control checked={selected} tabIndex={-1} aria-hidden />
      <span
        className={`min-w-0 flex-1 truncate text-body5 ${
          selected ? 'text-gray-900' : 'text-gray-600'
        }`}
      >
        {label}
      </span>
    </button>
  );
});

export default SelectableListItem;

'use client';

import { type ReactNode } from 'react';
import DropdownDetails from '../DropdownDetails/DropdownDetails';
import ListboxDropdownShell from '../ListboxDropdownShell/ListboxDropdownShell';

export type DropdownOption = {
  label: string;
  value: string;
};

export type DropdownProps = {
  options: DropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  icon?: ReactNode;
  className?: string;
  helperText?: string;
};

export default function Dropdown({
  options,
  value,
  onChange,
  placeholder = '?좏깮',
  icon,
  className = '',
  helperText,
}: DropdownProps) {
  const selected = options.find((o) => o.value === value);

  return (
    <ListboxDropdownShell
      className={className}
      triggerClassName="inline-flex h-[3.4rem] items-center justify-center gap-12 rounded-8 border border-gray-800 bg-white pl-16 pr-12 text-body2 text-gray-800 transition-colors hover:border-gray-900"
      trigger={({ open }) => (
        <>
          {icon && <span className="shrink-0 [&>svg]:icon-16">{icon}</span>}
          <span>{selected?.label ?? placeholder}</span>
          <svg
            width="12"
            height="8"
            viewBox="0 0 12 8"
            fill="none"
            aria-hidden
            className={`shrink-0 transition-transform ${
              open ? 'rotate-180' : ''
            }`}
          >
            <path
              d="M1 1.5l5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </>
      )}
      panel={({ closeAndFocusButton, panelProps }) => (
        <DropdownDetails
          {...panelProps}
          type="radio"
          options={options}
          selectedValues={value ? [value] : []}
          helperText={helperText}
          onSelect={(nextValue) => {
            onChange?.(nextValue);
            closeAndFocusButton();
          }}
          className="absolute left-0 top-full z-10 mt-4"
        />
      )}
    />
  );
}

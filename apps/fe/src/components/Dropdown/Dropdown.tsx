'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import DropdownDetails from '../DropdownDetails/DropdownDetails';

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
  placeholder = '선택',
  icon,
  className = '',
  helperText,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div ref={ref} className={`relative inline-block ${className}`.trim()}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-[3.4rem] items-center justify-center gap-12 rounded-8 border border-gray-800 bg-white pl-16 pr-12 text-body2 text-gray-800 transition-colors hover:border-gray-900"
      >
        {icon && <span className="shrink-0 [&>svg]:icon-16">{icon}</span>}
        <span>{selected?.label ?? placeholder}</span>
        <svg
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
          aria-hidden
          className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path
            d="M1 1.5l5 5 5-5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <DropdownDetails
          type="radio"
          options={options}
          selectedValues={value ? [value] : []}
          helperText={helperText}
          onSelect={(nextValue) => {
            onChange?.(nextValue);
            setOpen(false);
          }}
          className="absolute left-0 top-full z-10 mt-4"
        />
      )}
    </div>
  );
}

'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';

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
};

export default function Dropdown({
  options,
  value,
  onChange,
  placeholder = '선택',
  icon,
  className = '',
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
        className="inline-flex items-center gap-8 rounded-8 border border-gray-300 bg-white px-12 py-8 text-body2 text-gray-800 transition-colors hover:border-gray-400"
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
        <ul className="absolute left-0 top-full z-10 mt-4 min-w-full overflow-hidden rounded-12 border border-gray-300 bg-white py-4 shadow-[0_0.4rem_1.6rem_rgba(0,0,0,0.08)]">
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                onClick={() => {
                  onChange?.(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-8 px-16 py-8 text-body2 transition-colors hover:bg-gray-100 ${
                  option.value === value
                    ? 'font-semibold text-orange-500'
                    : 'text-gray-800'
                }`}
              >
                {option.value === value && (
                  <span className="h-8 w-8 rounded-full bg-orange-500" />
                )}
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import DownIcon from '@/assets/icons/down.svg';

export type SortOption = {
  value: string;
  label: string;
};

export type SortDropdownProps = {
  options: SortOption[];
  value: string;
  onChange: (next: string) => void;
};

export default function SortDropdown({
  options,
  value,
  onChange,
}: SortDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', onMouseDown);
    return () => window.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? '';

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-w-[12rem] items-center justify-between gap-8 rounded-12 border border-gray-300 bg-white px-12 py-8 text-body4 text-gray-700 transition-colors hover:bg-gray-100"
      >
        <span>{selectedLabel}</span>
        <DownIcon
          aria-hidden
          className={`icon-16 text-gray-900 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 z-10 mt-4 min-w-[14rem] overflow-hidden rounded-12 border border-gray-300 bg-white py-8 shadow-[0_0.4rem_1.2rem_rgba(0,0,0,0.08)]">
          {options.map((opt) => {
            const selected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-12 px-16 py-12 text-left text-body4 transition-colors hover:bg-gray-100 ${
                  selected ? 'text-orange-500' : 'text-gray-500'
                }`}
              >
                <span
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 ${
                    selected ? 'border-orange-500' : 'border-gray-400'
                  }`}
                >
                  {selected && (
                    <span className="h-8 w-8 rounded-full bg-orange-500" />
                  )}
                </span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

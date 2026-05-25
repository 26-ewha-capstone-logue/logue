'use client';

import DownIcon from '@/assets/icons/down.svg';
import { useListboxDropdown } from '@/hooks/useListboxDropdown';

export type SortOption<T extends string = string> = {
  value: T;
  label: string;
};

export type SortDropdownProps<T extends string = string> = {
  options: SortOption<T>[];
  value: T;
  onChange: (next: T) => void;
};

export default function SortDropdown<T extends string>({
  options,
  value,
  onChange,
}: SortDropdownProps<T>) {
  const {
    buttonRef,
    closeAndFocusButton,
    handleButtonKeyDown,
    handleListboxKeyDown,
    listboxId,
    open,
    rootRef,
    setOpen,
  } = useListboxDropdown();

  const selectedLabel = options.find((o) => o.value === value)?.label ?? '';

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleButtonKeyDown}
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
        <div
          id={listboxId}
          role="listbox"
          onKeyDown={handleListboxKeyDown}
          className="absolute left-0 z-10 mt-4 min-w-[14rem] overflow-hidden rounded-12 border border-gray-300 bg-white py-8 shadow-[0_0.4rem_1.2rem_rgba(0,0,0,0.08)]"
        >
          {options.map((opt) => {
            const selected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(opt.value);
                  closeAndFocusButton();
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

'use client';

import DownIcon from '@/assets/icons/down.svg';
import {
  ListboxDropdownShell,
  LISTBOX_DROPDOWN_PANEL_BASE_CLASS,
  LISTBOX_DROPDOWN_TRIGGER_BASE_CLASS,
} from '@/components';

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
  const selectedLabel = options.find((o) => o.value === value)?.label ?? '';

  return (
    <ListboxDropdownShell
      triggerClassName={`${LISTBOX_DROPDOWN_TRIGGER_BASE_CLASS} text-body4 text-gray-700`}
      trigger={({ open }) => (
        <>
          <span>{selectedLabel}</span>
          <DownIcon
            aria-hidden
            className={`icon-16 text-gray-900 transition-transform ${
              open ? 'rotate-180' : ''
            }`}
          />
        </>
      )}
      panel={({ closeAndFocusButton, panelProps }) => (
        <div
          {...panelProps}
          className={`${LISTBOX_DROPDOWN_PANEL_BASE_CLASS} min-w-[14rem] py-8`}
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
    />
  );
}

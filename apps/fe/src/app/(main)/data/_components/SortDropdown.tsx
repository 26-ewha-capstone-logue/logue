'use client';

import DownIcon from '@/assets/icons/down.svg';
import {
  ListboxOptionList,
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
          <ListboxOptionList
            closeAndFocusButton={closeAndFocusButton}
            options={options}
            value={value}
            variant="radio"
            onChange={onChange}
          />
        </div>
      )}
    />
  );
}

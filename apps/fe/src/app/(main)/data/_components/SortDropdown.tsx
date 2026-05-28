'use client';

import DownIcon from '@/assets/icons/down.svg';
import { SimpleListboxDropdown } from '@/components';

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
    <SimpleListboxDropdown
      icon={DownIcon}
      iconClassName="icon-16 text-gray-900"
      label={selectedLabel}
      options={options}
      panelClassName="min-w-[14rem] py-8"
      triggerClassName="text-body4 text-gray-700"
      value={value}
      variant="radio"
      onChange={onChange}
    />
  );
}

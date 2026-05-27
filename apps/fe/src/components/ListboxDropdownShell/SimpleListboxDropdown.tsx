'use client';

import type { ComponentType, SVGProps } from 'react';
import ListboxDropdownShell, {
  LISTBOX_DROPDOWN_PANEL_BASE_CLASS,
  LISTBOX_DROPDOWN_TRIGGER_BASE_CLASS,
} from './ListboxDropdownShell';
import {
  ListboxOptionList,
  type ListboxOption,
  type ListboxOptionListProps,
} from './ListboxOptionList';

type DropdownIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type SimpleListboxDropdownProps<T extends string = string> = {
  className?: string;
  icon: DropdownIcon;
  iconClassName: string;
  label: string;
  onChange: (next: T) => void;
  options: readonly ListboxOption<T>[];
  panelClassName?: string;
  triggerClassName: string;
  value: T;
  variant?: ListboxOptionListProps<T>['variant'];
};

export default function SimpleListboxDropdown<T extends string>({
  className,
  icon: Icon,
  iconClassName,
  label,
  onChange,
  options,
  panelClassName = '',
  triggerClassName,
  value,
  variant,
}: SimpleListboxDropdownProps<T>) {
  return (
    <ListboxDropdownShell
      className={className}
      triggerClassName={`${LISTBOX_DROPDOWN_TRIGGER_BASE_CLASS} ${triggerClassName}`}
      trigger={({ open }) => (
        <>
          <span>{label}</span>
          <Icon
            aria-hidden
            className={`${iconClassName} transition-transform ${
              open ? 'rotate-180' : ''
            }`}
          />
        </>
      )}
      panel={({ closeAndFocusButton, panelProps }) => (
        <div
          {...panelProps}
          className={`${LISTBOX_DROPDOWN_PANEL_BASE_CLASS} ${panelClassName}`.trim()}
        >
          <ListboxOptionList
            closeAndFocusButton={closeAndFocusButton}
            options={options}
            value={value}
            variant={variant}
            onChange={onChange}
          />
        </div>
      )}
    />
  );
}

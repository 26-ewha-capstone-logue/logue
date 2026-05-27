'use client';

import type { ReactNode } from 'react';
import ListboxDropdown, {
  type ListboxDropdownListboxProps,
} from '../ListboxDropdown/ListboxDropdown';

export const LISTBOX_DROPDOWN_TRIGGER_BASE_CLASS =
  'inline-flex min-w-[12rem] items-center justify-between gap-8 rounded-12 border border-gray-300 bg-white px-12 py-8 transition-colors hover:bg-gray-100';

export const LISTBOX_DROPDOWN_PANEL_BASE_CLASS =
  'absolute left-0 z-10 mt-4 overflow-hidden rounded-12 border border-gray-300 bg-white shadow-[0_0.4rem_1.2rem_rgba(0,0,0,0.08)]';

export type ListboxDropdownShellPanelProps = {
  closeAndFocusButton: () => void;
  open: boolean;
  panelProps: ListboxDropdownListboxProps;
};

export type ListboxDropdownShellProps = {
  className?: string;
  optionSelector?: string;
  panel: (props: ListboxDropdownShellPanelProps) => ReactNode;
  trigger: (props: { open: boolean }) => ReactNode;
  triggerClassName: string;
};

export default function ListboxDropdownShell({
  className,
  optionSelector,
  panel,
  trigger,
  triggerClassName,
}: ListboxDropdownShellProps) {
  return (
    <ListboxDropdown className={className} optionSelector={optionSelector}>
      {({ closeAndFocusButton, listboxProps, open, triggerProps }) => (
        <>
          <button {...triggerProps} className={triggerClassName}>
            {trigger({ open })}
          </button>
          {open &&
            panel({
              closeAndFocusButton,
              open,
              panelProps: listboxProps,
            })}
        </>
      )}
    </ListboxDropdown>
  );
}

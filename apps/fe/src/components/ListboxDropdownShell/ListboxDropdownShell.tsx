'use client';

import type { ReactNode } from 'react';
import ListboxDropdown, {
  type ListboxDropdownListboxProps,
} from '../ListboxDropdown/ListboxDropdown';

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

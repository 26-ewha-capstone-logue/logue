'use client';

import {
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEventHandler,
  type ReactNode,
  type Ref,
} from 'react';
import { useListboxDropdown } from '@/hooks/useListboxDropdown';

export type ListboxDropdownTriggerProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> & {
  ref: Ref<HTMLButtonElement>;
};

export type ListboxDropdownListboxProps = Omit<
  HTMLAttributes<HTMLElement>,
  'children'
> & {
  id: string;
  role: 'listbox';
  onKeyDown: KeyboardEventHandler<HTMLElement>;
};

export type ListboxDropdownRenderProps = {
  closeAndFocusButton: () => void;
  listboxId: string;
  listboxProps: ListboxDropdownListboxProps;
  open: boolean;
  triggerProps: ListboxDropdownTriggerProps;
};

export type ListboxDropdownProps = {
  children: (props: ListboxDropdownRenderProps) => ReactNode;
  optionSelector?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>;

export default function ListboxDropdown({
  children,
  className = '',
  optionSelector,
  ...rest
}: ListboxDropdownProps) {
  const {
    buttonRef,
    closeAndFocusButton,
    handleButtonKeyDown,
    handleListboxKeyDown,
    listboxId,
    open,
    rootRef,
    setOpen,
  } = useListboxDropdown(
    optionSelector === undefined ? undefined : { optionSelector },
  );

  return (
    <div
      ref={rootRef}
      className={`relative inline-block ${className}`.trim()}
      {...rest}
    >
      {children({
        closeAndFocusButton,
        listboxId,
        listboxProps: {
          id: listboxId,
          role: 'listbox',
          onKeyDown: handleListboxKeyDown,
        },
        open,
        triggerProps: {
          ref: buttonRef,
          type: 'button',
          'aria-haspopup': 'listbox',
          'aria-expanded': open,
          'aria-controls': open ? listboxId : undefined,
          onClick: () => setOpen((prev) => !prev),
          onKeyDown: handleButtonKeyDown,
        },
      })}
    </div>
  );
}

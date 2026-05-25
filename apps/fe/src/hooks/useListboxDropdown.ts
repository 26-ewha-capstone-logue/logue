'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';

type UseListboxDropdownOptions = {
  optionSelector?: string;
};

const DEFAULT_OPTION_SELECTOR =
  '[role="option"]:not([disabled]):not([aria-disabled="true"])';

export function useListboxDropdown({
  optionSelector = DEFAULT_OPTION_SELECTOR,
}: UseListboxDropdownOptions = {}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();

  useEffect(() => {
    if (!open) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };

    window.addEventListener('mousedown', handleMouseDown);
    return () => window.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  const getOptions = useCallback(
    () =>
      Array.from(
        rootRef.current?.querySelectorAll<HTMLElement>(optionSelector) ?? [],
      ),
    [optionSelector],
  );

  const focusOption = useCallback(
    (edge: 'first' | 'last') => {
      window.requestAnimationFrame(() => {
        const options = getOptions();
        const target = edge === 'first' ? options[0] : options.at(-1);
        target?.focus();
      });
    },
    [getOptions],
  );

  const closeAndFocusButton = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  const handleButtonKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }

      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

      event.preventDefault();
      setOpen(true);
      focusOption(event.key === 'ArrowUp' ? 'last' : 'first');
    },
    [focusOption],
  );

  const handleListboxKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === 'Escape') {
        closeAndFocusButton();
        return;
      }

      if (
        event.key !== 'ArrowDown' &&
        event.key !== 'ArrowUp' &&
        event.key !== 'Home' &&
        event.key !== 'End'
      ) {
        return;
      }

      const options = getOptions();
      if (options.length === 0) return;

      event.preventDefault();

      if (event.key === 'Home') {
        options[0].focus();
        return;
      }

      if (event.key === 'End') {
        options.at(-1)?.focus();
        return;
      }

      const activeIndex = options.findIndex(
        (option) => option === document.activeElement,
      );
      const lastIndex = options.length - 1;
      const nextIndex =
        event.key === 'ArrowDown'
          ? activeIndex >= lastIndex
            ? 0
            : activeIndex + 1
          : activeIndex <= 0
            ? lastIndex
            : activeIndex - 1;

      options[nextIndex].focus();
    },
    [closeAndFocusButton, getOptions],
  );

  return {
    buttonRef,
    closeAndFocusButton,
    handleButtonKeyDown,
    handleListboxKeyDown,
    listboxId,
    open,
    rootRef,
    setOpen,
  };
}

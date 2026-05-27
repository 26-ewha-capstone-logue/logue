'use client';

import type { KeyboardEvent } from 'react';

export type ListboxOption<T extends string = string> = {
  value: T;
  label: string;
};

export type ListboxOptionListProps<T extends string = string> = {
  closeAndFocusButton: () => void;
  onChange: (next: T) => void;
  options: readonly ListboxOption<T>[];
  value: T;
  variant?: 'plain' | 'radio';
};

export type ListboxCheckboxOptionListProps<T extends string = string> = {
  maxSelect?: number;
  onChange: (next: T[]) => void;
  options: readonly T[];
  values: readonly T[];
};

export function ListboxOptionList<T extends string>({
  closeAndFocusButton,
  onChange,
  options,
  value,
  variant = 'plain',
}: ListboxOptionListProps<T>) {
  return (
    <>
      {options.map((opt) => {
        const selected = opt.value === value;

        if (variant === 'radio') {
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
        }

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
            className={`block w-full px-12 py-8 text-left text-body2 transition-colors hover:bg-gray-100 ${
              selected ? 'text-orange-500' : 'text-gray-900'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </>
  );
}

export function ListboxCheckboxOptionList<T extends string>({
  maxSelect,
  onChange,
  options,
  values,
}: ListboxCheckboxOptionListProps<T>) {
  const handleToggle = (opt: T) => {
    const checked = values.includes(opt);
    const disabled =
      !checked && maxSelect !== undefined && values.length >= maxSelect;

    if (disabled) return;

    const next = checked
      ? values.filter((value) => value !== opt)
      : [...values, opt];
    onChange(next);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLLabelElement>, opt: T) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;

    event.preventDefault();
    handleToggle(opt);
  };

  return (
    <>
      {options.map((opt) => {
        const checked = values.includes(opt);
        const disabled =
          !checked && maxSelect !== undefined && values.length >= maxSelect;

        return (
          <label
            key={opt}
            role="option"
            aria-selected={checked}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : 0}
            onClick={(event) => {
              event.preventDefault();
              handleToggle(opt);
            }}
            onKeyDown={(event) => handleKeyDown(event, opt)}
            className={`flex cursor-pointer items-center gap-8 px-12 py-8 text-body2 transition-colors hover:bg-gray-100 ${
              disabled ? 'cursor-not-allowed text-gray-500' : 'text-gray-900'
            }`}
          >
            <input
              type="checkbox"
              aria-hidden
              tabIndex={-1}
              checked={checked}
              disabled={disabled}
              readOnly
              className="h-16 w-16 accent-orange-500"
            />
            <span>{opt}</span>
          </label>
        );
      })}
    </>
  );
}

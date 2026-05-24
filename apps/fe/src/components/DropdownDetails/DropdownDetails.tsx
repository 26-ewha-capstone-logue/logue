import { type HTMLAttributes, type KeyboardEvent } from 'react';
import SelectableListItem from '../SelectableListItem/SelectableListItem';

export type DropdownDetailsOption = {
  label: string;
  value: string;
};

export type DropdownDetailsProps = {
  type?: 'checkbox' | 'radio';
  options: DropdownDetailsOption[];
  selectedValues?: string[];
  helperText?: string;
  onSelect?: (value: string) => void;
  onEscape?: () => void;
} & Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onSelect'>;

function getEnabledOptions(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLButtonElement>('[role="option"]'),
  ).filter((option) => !option.disabled);
}

export default function DropdownDetails({
  type = 'checkbox',
  options,
  selectedValues = [],
  helperText = type === 'checkbox' ? '최대 2개 선택' : '단일 선택',
  onSelect,
  onEscape,
  className = '',
  ...rest
}: DropdownDetailsProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onEscape?.();
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

    const options = getEnabledOptions(event.currentTarget);
    if (options.length === 0) return;

    event.preventDefault();

    const activeIndex = options.findIndex(
      (option) => option === document.activeElement,
    );
    const lastIndex = options.length - 1;

    if (event.key === 'Home') {
      options[0].focus();
      return;
    }

    if (event.key === 'End') {
      options[lastIndex].focus();
      return;
    }

    const nextIndex =
      event.key === 'ArrowDown'
        ? activeIndex >= lastIndex
          ? 0
          : activeIndex + 1
        : activeIndex <= 0
          ? lastIndex
          : activeIndex - 1;

    options[nextIndex].focus();
  };

  return (
    <div
      role="listbox"
      aria-multiselectable={type === 'checkbox' ? true : undefined}
      onKeyDown={handleKeyDown}
      className={`w-[16.9rem] overflow-hidden rounded-[1rem] border border-gray-400 bg-white p-[0.5rem] shadow-[0_0.4rem_0.4rem_rgba(228,228,228,0.2)] ${className}`.trim()}
      {...rest}
    >
      {helperText && (
        <p className="px-[1rem] py-[0.35rem] text-body4 text-gray-800">
          {helperText}
        </p>
      )}
      <div className="max-h-[13.8rem] overflow-y-auto">
        {options.map((option) => (
          <SelectableListItem
            key={option.value}
            role="option"
            aria-selected={selectedValues.includes(option.value)}
            type={type}
            label={option.label}
            selected={selectedValues.includes(option.value)}
            className="w-full"
            onClick={() => onSelect?.(option.value)}
          />
        ))}
      </div>
    </div>
  );
}

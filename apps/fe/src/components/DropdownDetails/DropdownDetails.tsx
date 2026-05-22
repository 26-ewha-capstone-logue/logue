import { type HTMLAttributes } from 'react';
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
} & Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onSelect'>;

export default function DropdownDetails({
  type = 'checkbox',
  options,
  selectedValues = [],
  helperText = type === 'checkbox' ? '최대 2개 선택' : '단일 선택',
  onSelect,
  className = '',
  ...rest
}: DropdownDetailsProps) {
  return (
    <div
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

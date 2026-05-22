import { type HTMLAttributes } from 'react';
import Dropdown, { type DropdownOption } from '../Dropdown/Dropdown';

export type DataRowProps = {
  title?: string;
  contents?: string;
  state?: 'default' | 'selected';
  dropdownValue?: string;
  dropdownOptions?: DropdownOption[];
  onDropdownChange?: (value: string) => void;
} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>;

const defaultOptions: DropdownOption[] = [
  { label: 'internal_test 제외', value: 'internal_test' },
  { label: 'signup_date', value: 'signup_date' },
];

export default function DataRow({
  title = '날짜 기준',
  contents = '데이터 내용 입력',
  state = 'default',
  dropdownValue,
  dropdownOptions = defaultOptions,
  onDropdownChange,
  className = '',
  ...rest
}: DataRowProps) {
  const selected = state === 'selected';

  return (
    <div
      className={`flex w-[49.8rem] gap-[4.4rem] border-b border-[#f0f0f0] pb-[0.9rem] pt-8 ${
        selected ? 'items-center' : 'items-start'
      } ${className}`.trim()}
      {...rest}
    >
      <span className="w-[8rem] shrink-0 whitespace-nowrap text-body2 text-gray-800">
        {title}
      </span>
      {selected ? (
        <Dropdown
          options={dropdownOptions}
          value={dropdownValue}
          placeholder="internal_test 제외"
          onChange={onDropdownChange}
        />
      ) : (
        <span className="min-w-0 flex-1 text-body2 text-orange-600">
          {contents}
        </span>
      )}
    </div>
  );
}

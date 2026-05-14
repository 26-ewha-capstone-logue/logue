'use client';

export type CheckboxProps = {
  checked: boolean;
  onChange: () => void;
  /** 시각적으로 일부 선택 상태 (전체 선택 행에서 사용) */
  indeterminate?: boolean;
  className?: string;
};

export default function Checkbox({
  checked,
  onChange,
  indeterminate = false,
  className = '',
}: CheckboxProps) {
  return (
    <label className={`inline-flex cursor-pointer items-center ${className}`.trim()}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={`flex h-[1.8rem] w-[1.8rem] items-center justify-center rounded-4 border transition-colors ${
          checked || indeterminate
            ? 'border-orange-500 bg-orange-500'
            : 'border-gray-400 bg-white'
        }`}
      >
        {checked && !indeterminate && (
          <svg viewBox="0 0 12 12" fill="none" className="h-12 w-12">
            <path
              d="M3 6.5 L5.2 8.7 L9 4.5"
              stroke="white"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {indeterminate && !checked && (
          <span className="block h-[0.2rem] w-10 rounded-full bg-white" />
        )}
      </span>
    </label>
  );
}

'use client';

type SingleSelectProps = {
  options: string[];
  value: string | null;
  onChange: (value: string) => void;
};

type MultiSelectProps = {
  options: string[];
  values: Set<string>;
  onToggle: (value: string) => void;
};

type OptionButtonProps = {
  active: boolean;
  children: string;
  className?: string;
  indicator?: 'none' | 'radio' | 'checkbox';
  onClick: () => void;
};

function optionButtonClass(active: boolean, className = '') {
  return `rounded-12 border px-16 py-12 text-body2 transition-colors ${
    active
      ? 'border-orange-500 bg-orange-100 text-orange-600'
      : 'border-gray-300 bg-white text-gray-800 hover:border-gray-400'
  } ${className}`.trim();
}

function OptionButton({
  active,
  children,
  className,
  indicator = 'none',
  onClick,
}: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={indicator === 'none' ? active : undefined}
      className={optionButtonClass(active, className)}
    >
      <span>{children}</span>
      {indicator === 'radio' && (
        <span
          aria-hidden
          className={`relative inline-flex h-[1.8rem] w-[1.8rem] items-center justify-center rounded-full border-2 transition-colors ${
            active ? 'border-orange-500' : 'border-gray-400'
          }`}
        >
          {active && (
            <span className="absolute inline-block h-8 w-8 rounded-full bg-orange-500" />
          )}
        </span>
      )}
      {indicator === 'checkbox' && (
        <span
          aria-hidden
          className={`inline-flex h-[1.8rem] w-[1.8rem] items-center justify-center rounded-4 border-2 transition-colors ${
            active
              ? 'border-orange-500 bg-orange-500'
              : 'border-gray-400 bg-white'
          }`}
        >
          {active && (
            <svg
              aria-hidden
              viewBox="0 0 12 10"
              className="h-[1rem] w-12 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 5 4.5 8.5 11 1.5" />
            </svg>
          )}
        </span>
      )}
    </button>
  );
}

export function DomainGrid({ options, value, onChange }: SingleSelectProps) {
  return (
    <div className="grid grid-cols-2 gap-12">
      {options.map((option) => (
        <OptionButton
          key={option}
          active={option === value}
          onClick={() => onChange(option)}
        >
          {option}
        </OptionButton>
      ))}
    </div>
  );
}

export function RadioList({ options, value, onChange }: SingleSelectProps) {
  return (
    <div className="flex flex-col gap-12">
      {options.map((option) => (
        <OptionButton
          key={option}
          active={option === value}
          className="flex items-center justify-between text-left"
          indicator="radio"
          onClick={() => onChange(option)}
        >
          {option}
        </OptionButton>
      ))}
    </div>
  );
}

export function CheckboxList({ options, values, onToggle }: MultiSelectProps) {
  return (
    <div className="flex flex-col gap-12">
      {options.map((option) => (
        <OptionButton
          key={option}
          active={values.has(option)}
          className="flex items-center justify-between text-left"
          indicator="checkbox"
          onClick={() => onToggle(option)}
        >
          {option}
        </OptionButton>
      ))}
    </div>
  );
}

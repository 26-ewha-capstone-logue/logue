'use client';

import ArrowDownIcon from '@/assets/icons/arrow-down.svg';
import { useListboxDropdown } from '@/hooks/useListboxDropdown';

type CommonProps = {
  options: string[];
  className?: string;
};

type SingleProps = CommonProps & {
  multi?: false;
  value: string;
  onChange: (next: string) => void;
};

type MultiProps = CommonProps & {
  multi: true;
  values: string[];
  maxSelect?: number;
  onChange: (next: string[]) => void;
  /** 옵션 리스트 상단에 표시되는 헤더 (예: "최대 2개 선택") */
  headerLabel?: string;
};

export type CriterionSelectProps = SingleProps | MultiProps;

export default function CriterionSelect(props: CriterionSelectProps) {
  const optionFocusSelector = props.multi
    ? '[role="option"]:not([aria-disabled="true"])'
    : '[role="option"]:not([disabled]):not([aria-disabled="true"])';
  const {
    buttonRef,
    closeAndFocusButton,
    handleButtonKeyDown,
    handleListboxKeyDown,
    listboxId,
    open,
    rootRef,
    setOpen,
  } = useListboxDropdown({ optionSelector: optionFocusSelector });

  const buttonLabel = props.multi
    ? props.values.length === 0
      ? '선택'
      : props.values.length === 1
        ? props.values[0]
        : `${props.values[0]} 외 ${props.values.length - 1}`
    : props.value;

  return (
    <div
      ref={rootRef}
      className={`relative inline-block ${props.className ?? ''}`.trim()}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleButtonKeyDown}
        className="inline-flex min-w-[12rem] items-center justify-between gap-8 rounded-12 border border-gray-300 bg-white px-12 py-8 text-body2 text-gray-900 transition-colors hover:bg-gray-100"
      >
        <span>{buttonLabel}</span>
        <ArrowDownIcon
          aria-hidden
          className={`icon-12 text-gray-700 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-multiselectable={props.multi ? true : undefined}
          onKeyDown={handleListboxKeyDown}
          className="absolute left-0 z-10 mt-4 w-max min-w-full overflow-hidden rounded-12 border border-gray-300 bg-white shadow-[0_0.4rem_1.2rem_rgba(0,0,0,0.08)]"
        >
          {props.multi && props.headerLabel && (
            <div className="border-b border-gray-200 px-12 py-8 text-body4 text-gray-600">
              {props.headerLabel}
            </div>
          )}

          {props.options.map((opt) => {
            if (props.multi) {
              const checked = props.values.includes(opt);
              const disabled =
                !checked &&
                props.maxSelect !== undefined &&
                props.values.length >= props.maxSelect;
              const handleToggle = () => {
                if (disabled) return;

                const next = checked
                  ? props.values.filter((v) => v !== opt)
                  : [...props.values, opt];
                props.onChange(next);
              };

              return (
                <label
                  key={opt}
                  role="option"
                  aria-selected={checked}
                  aria-disabled={disabled}
                  tabIndex={disabled ? -1 : 0}
                  onClick={(event) => {
                    event.preventDefault();
                    handleToggle();
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;

                    event.preventDefault();
                    handleToggle();
                  }}
                  className={`flex cursor-pointer items-center gap-8 px-12 py-8 text-body2 transition-colors hover:bg-gray-100 ${
                    disabled
                      ? 'cursor-not-allowed text-gray-500'
                      : 'text-gray-900'
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
            }

            const selected = props.value === opt;
            return (
              <button
                key={opt}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  props.onChange(opt);
                  closeAndFocusButton();
                }}
                className={`block w-full px-12 py-8 text-left text-body2 transition-colors hover:bg-gray-100 ${
                  selected ? 'text-orange-500' : 'text-gray-900'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

'use client';

import ArrowDownIcon from '@/assets/icons/arrow-down.svg';
import {
  ListboxDropdownShell,
  LISTBOX_DROPDOWN_PANEL_BASE_CLASS,
  LISTBOX_DROPDOWN_TRIGGER_BASE_CLASS,
} from '@/components';

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
  /** ?듭뀡 由ъ뒪???곷떒???쒖떆?섎뒗 ?ㅻ뜑 (?? "理쒕? 2媛??좏깮") */
  headerLabel?: string;
};

export type CriterionSelectProps = SingleProps | MultiProps;

export default function CriterionSelect(props: CriterionSelectProps) {
  const optionFocusSelector = props.multi
    ? '[role="option"]:not([aria-disabled="true"])'
    : '[role="option"]:not([disabled]):not([aria-disabled="true"])';

  const buttonLabel = props.multi
    ? props.values.length === 0
      ? '?좏깮'
      : props.values.length === 1
        ? props.values[0]
        : `${props.values[0]} ??${props.values.length - 1}`
    : props.value;

  return (
    <ListboxDropdownShell
      className={props.className}
      optionSelector={optionFocusSelector}
      triggerClassName={`${LISTBOX_DROPDOWN_TRIGGER_BASE_CLASS} text-body2 text-gray-900`}
      trigger={({ open }) => (
        <>
          <span>{buttonLabel}</span>
          <ArrowDownIcon
            aria-hidden
            className={`icon-12 text-gray-700 transition-transform ${
              open ? 'rotate-180' : ''
            }`}
          />
        </>
      )}
      panel={({ closeAndFocusButton, panelProps }) => (
        <div
          {...panelProps}
          aria-multiselectable={props.multi ? true : undefined}
          className={`${LISTBOX_DROPDOWN_PANEL_BASE_CLASS} w-max min-w-full`}
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
    />
  );
}

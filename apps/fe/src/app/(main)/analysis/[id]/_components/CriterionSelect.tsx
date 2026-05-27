'use client';

import ArrowDownIcon from '@/assets/icons/arrow-down.svg';
import {
  ListboxCheckboxOptionList,
  ListboxOptionList,
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

          {props.multi ? (
            <ListboxCheckboxOptionList
              maxSelect={props.maxSelect}
              options={props.options}
              values={props.values}
              onChange={props.onChange}
            />
          ) : (
            <ListboxOptionList
              closeAndFocusButton={closeAndFocusButton}
              options={props.options.map((opt) => ({
                value: opt,
                label: opt,
              }))}
              value={props.value}
              onChange={props.onChange}
            />
          )}
        </div>
      )}
    />
  );
}

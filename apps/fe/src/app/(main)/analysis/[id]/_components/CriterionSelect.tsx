'use client';

import ArrowDownIcon from '@/assets/icons/arrow-down.svg';
import {
  ListboxCheckboxOptionList,
  ListboxDropdownShell,
  LISTBOX_DROPDOWN_PANEL_BASE_CLASS,
  LISTBOX_DROPDOWN_TRIGGER_BASE_CLASS,
  SimpleListboxDropdown,
  type ListboxOption,
  type ListboxOptionBadge,
} from '@/components';
import type {
  CriteriaOption,
  CriteriaOptionOrigin,
} from '../_config/criteriaEditRows';

type CommonProps = {
  options: CriteriaOption[];
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

const ORIGIN_BADGES = {
  dynamic: { label: '분석값', tone: 'dynamic' },
  default: { label: '기본', tone: 'default' },
} as const satisfies Record<CriteriaOptionOrigin, ListboxOptionBadge>;

function toListboxOption(option: CriteriaOption): ListboxOption {
  return {
    value: option.value,
    label: option.label,
    badges: option.origins.map((origin) => ORIGIN_BADGES[origin]),
  };
}

export default function CriterionSelect(props: CriterionSelectProps) {
  const options = props.options.map(toListboxOption);

  if (!props.multi) {
    return (
      <SimpleListboxDropdown
        className={props.className}
        icon={ArrowDownIcon}
        iconClassName="icon-12 text-gray-700"
        label={props.value}
        options={options}
        panelClassName="w-max min-w-full"
        triggerClassName="text-body2 text-gray-900"
        value={props.value}
        onChange={props.onChange}
      />
    );
  }

  const buttonLabel =
    props.values.length === 0
      ? '?좏깮'
      : props.values.length === 1
        ? props.values[0]
        : `${props.values[0]} ??${props.values.length - 1}`;

  return (
    <ListboxDropdownShell
      className={props.className}
      optionSelector="[role='option']:not([aria-disabled='true'])"
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
      panel={({ panelProps }) => (
        <div
          {...panelProps}
          aria-multiselectable
          className={`${LISTBOX_DROPDOWN_PANEL_BASE_CLASS} w-max min-w-full`}
        >
          {props.headerLabel && (
            <div className="border-b border-gray-200 px-12 py-8 text-body4 text-gray-600">
              {props.headerLabel}
            </div>
          )}

          <ListboxCheckboxOptionList
            maxSelect={props.maxSelect}
            options={options}
            values={props.values}
            onChange={props.onChange}
          />
        </div>
      )}
    />
  );
}

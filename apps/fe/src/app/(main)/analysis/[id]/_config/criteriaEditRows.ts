import type {
  CriteriaEditValues,
  CriteriaViewModel,
} from '../_models/analysisViewModels';
import { normalizeString } from '../_utils/stringList';
import { CRITERIA_FIELD_DEFINITIONS } from './criteriaSchema';

export type CriteriaOptionOrigin = 'default' | 'dynamic';

export type CriteriaOption = {
  value: string;
  label: string;
  origins: CriteriaOptionOrigin[];
};

export type CriteriaStaticRow = {
  kind: 'static';
  label: string;
  value: string;
};

export type CriteriaSingleRow = {
  kind: 'single';
  label: string;
  key: keyof Pick<
    CriteriaEditValues,
    | 'baseDateColumn'
    | 'standardPeriod'
    | 'comparePeriod'
    | 'sortBy'
    | 'sortDirection'
  >;
  options: CriteriaOption[];
};

export type CriteriaMultiRow = {
  kind: 'multi';
  label: string;
  key: 'groupBy';
  options: CriteriaOption[];
  maxSelect?: number;
  headerLabel: string;
};

export type CriteriaEditRowSpec =
  | CriteriaStaticRow
  | CriteriaSingleRow
  | CriteriaMultiRow;

const DEFAULT_PERIOD_OPTIONS = ['이번 주', '지난 주', '이번 달', '지난 달'];
const DEFAULT_SORT_DIRECTION_OPTIONS = ['ASC', 'DESC'];
const FIELD = CRITERIA_FIELD_DEFINITIONS;

function createCriteriaOptions({
  defaults = [],
  dynamic = [],
}: {
  defaults?: readonly (string | null | undefined)[];
  dynamic?: readonly (string | null | undefined)[];
}): CriteriaOption[] {
  const options = new Map<string, CriteriaOption>();

  const addOption = (
    value: string | null | undefined,
    origin: CriteriaOptionOrigin,
  ) => {
    const normalized = normalizeString(value);
    if (!normalized) return;

    const option = options.get(normalized);
    if (!option) {
      options.set(normalized, {
        value: normalized,
        label: normalized,
        origins: [origin],
      });
      return;
    }

    if (!option.origins.includes(origin)) {
      option.origins.push(origin);
    }
  };

  dynamic.forEach((value) => addOption(value, 'dynamic'));
  defaults.forEach((value) => addOption(value, 'default'));

  return Array.from(options.values());
}

export function createCriteriaEditRows({
  baseDateColumnOptions,
  criteria,
  groupByOptions,
  sortByOptions,
  sortDirectionOptions,
  values,
}: {
  baseDateColumnOptions?: string[];
  criteria: CriteriaViewModel;
  groupByOptions?: string[];
  sortByOptions?: string[];
  sortDirectionOptions?: string[];
  values: CriteriaEditValues;
}): CriteriaEditRowSpec[] {
  const groupBy = values.groupBy.length > 0 ? values.groupBy : [''];

  return [
    {
      kind: 'static',
      label: FIELD.analysisType.label,
      value: criteria.analysisType.label,
    },
    {
      kind: 'static',
      label: FIELD.metricName.label,
      value: criteria.metric.label,
    },
    {
      kind: 'single',
      label: FIELD.baseDateColumn.label,
      key: 'baseDateColumn',
      options: createCriteriaOptions({
        dynamic: [values.baseDateColumn, ...(baseDateColumnOptions ?? [])],
      }),
    },
    {
      kind: 'single',
      label: FIELD.standardPeriod.label,
      key: 'standardPeriod',
      options: createCriteriaOptions({
        defaults: DEFAULT_PERIOD_OPTIONS,
        dynamic: [values.standardPeriod],
      }),
    },
    {
      kind: 'single',
      label: FIELD.comparePeriod.label,
      key: 'comparePeriod',
      options: createCriteriaOptions({
        defaults: DEFAULT_PERIOD_OPTIONS,
        dynamic: [values.comparePeriod],
      }),
    },
    {
      kind: 'multi',
      label: FIELD.groupBy.label,
      key: 'groupBy',
      options: createCriteriaOptions({
        dynamic: [...groupBy, ...(groupByOptions ?? [])],
      }),
      maxSelect: 5,
      headerLabel: '여러 값 선택 가능',
    },
    {
      kind: 'single',
      label: FIELD.sortBy.label,
      key: 'sortBy',
      options: createCriteriaOptions({
        dynamic: [values.sortBy, ...(sortByOptions ?? [])],
      }),
    },
    {
      kind: 'single',
      label: FIELD.sortDirection.label,
      key: 'sortDirection',
      options: createCriteriaOptions({
        defaults:
          sortDirectionOptions === undefined
            ? DEFAULT_SORT_DIRECTION_OPTIONS
            : [],
        dynamic: [values.sortDirection, ...(sortDirectionOptions ?? [])],
      }),
    },
    {
      kind: 'static',
      label: FIELD.limitNum.label,
      value: values.limitNum == null ? '제한 없음' : `${values.limitNum}개`,
    },
    {
      kind: 'static',
      label: FIELD.filters.label,
      value:
        values.filters.length === 0
          ? '없음'
          : values.filters
              .map((filter) => filter.label)
              .filter(Boolean)
              .join(', '),
    },
  ];
}

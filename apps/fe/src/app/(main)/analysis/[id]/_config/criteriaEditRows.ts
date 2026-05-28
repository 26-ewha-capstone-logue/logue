import type {
  CriteriaEditValues,
  CriteriaViewModel,
} from '../_models/analysisViewModels';
import { uniqueStrings as uniqueOptions } from '../_utils/stringList';
import { CRITERIA_FIELD_LABELS } from './criteriaSchema';

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
  options: string[];
};

export type CriteriaMultiRow = {
  kind: 'multi';
  label: string;
  key: 'groupBy';
  options: string[];
  maxSelect?: number;
  headerLabel: string;
};

export type CriteriaEditRowSpec =
  | CriteriaStaticRow
  | CriteriaSingleRow
  | CriteriaMultiRow;

const DEFAULT_PERIOD_OPTIONS = ['이번 주', '지난 주', '이번 달', '지난 달'];
const DEFAULT_SORT_DIRECTION_OPTIONS = ['ASC', 'DESC'];

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
      label: CRITERIA_FIELD_LABELS.analysisType,
      value: criteria.analysisType.label,
    },
    {
      kind: 'static',
      label: CRITERIA_FIELD_LABELS.metricName,
      value: criteria.metric.label,
    },
    {
      kind: 'single',
      label: CRITERIA_FIELD_LABELS.baseDateColumn,
      key: 'baseDateColumn',
      options: uniqueOptions([
        values.baseDateColumn,
        ...(baseDateColumnOptions ?? []),
      ]),
    },
    {
      kind: 'single',
      label: CRITERIA_FIELD_LABELS.standardPeriod,
      key: 'standardPeriod',
      options: uniqueOptions([
        values.standardPeriod,
        ...DEFAULT_PERIOD_OPTIONS,
      ]),
    },
    {
      kind: 'single',
      label: CRITERIA_FIELD_LABELS.comparePeriod,
      key: 'comparePeriod',
      options: uniqueOptions([values.comparePeriod, ...DEFAULT_PERIOD_OPTIONS]),
    },
    {
      kind: 'multi',
      label: CRITERIA_FIELD_LABELS.groupBy,
      key: 'groupBy',
      options: uniqueOptions([...groupBy, ...(groupByOptions ?? [])]),
      maxSelect: 5,
      headerLabel: '여러 값 선택 가능',
    },
    {
      kind: 'single',
      label: CRITERIA_FIELD_LABELS.sortBy,
      key: 'sortBy',
      options: uniqueOptions([values.sortBy, ...(sortByOptions ?? [])]),
    },
    {
      kind: 'single',
      label: CRITERIA_FIELD_LABELS.sortDirection,
      key: 'sortDirection',
      options: uniqueOptions([
        values.sortDirection,
        ...(sortDirectionOptions ?? DEFAULT_SORT_DIRECTION_OPTIONS),
      ]),
    },
    {
      kind: 'static',
      label: CRITERIA_FIELD_LABELS.limitNum,
      value: values.limitNum == null ? '제한 없음' : `${values.limitNum}개`,
    },
    {
      kind: 'static',
      label: CRITERIA_FIELD_LABELS.filters,
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

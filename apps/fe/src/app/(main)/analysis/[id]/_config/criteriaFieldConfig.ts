import type { CriteriaInfo } from '@/apis/analysis';
import type {
  CriteriaEditValues,
  CriteriaViewModel,
} from '../_models/analysisViewModels';
import { uniqueStrings as uniqueOptions } from '../_utils/stringList';

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

export const ANALYSIS_TYPE_LABELS: Record<string, string> = {
  COMPARISON: '비교 분석',
  RANKING: '순위 분석',
};

export const CRITERIA_FIELD_LABELS = {
  analysisType: '분석 방식',
  metricName: '지표',
  baseDateColumn: '날짜 기준',
  standardPeriod: '분석 기간',
  comparePeriod: '비교 기간',
  groupBy: '비교 기준',
  sortBy: '정렬 기준',
  sortDirection: '정렬 순서',
  limitNum: '조회 개수',
  filters: '적용 조건',
} as const;

const DEFAULT_PERIOD_OPTIONS = ['이번 주', '지난 주', '이번 달', '지난 달'];
const DEFAULT_SORT_DIRECTION_OPTIONS = ['ASC', 'DESC'];

function normalizeString(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed || null;
}

function normalizeStringList(values: string[] | null | undefined) {
  return Array.isArray(values)
    ? Array.from(
        new Set(
          values
            .map((value) => normalizeString(value))
            .filter(Boolean) as string[],
        ),
      )
    : [];
}

export function getMissingCriteriaFields(criteria?: CriteriaInfo | null) {
  if (!criteria) {
    return Object.values(CRITERIA_FIELD_LABELS).filter(
      (label) => label !== CRITERIA_FIELD_LABELS.filters,
    );
  }

  const missing: string[] = [];
  const analysisType = normalizeString(criteria.analysisType);

  if (!analysisType) missing.push(CRITERIA_FIELD_LABELS.analysisType);
  if (!normalizeString(criteria.metricName))
    missing.push(CRITERIA_FIELD_LABELS.metricName);
  if (!normalizeString(criteria.baseDateColumn))
    missing.push(CRITERIA_FIELD_LABELS.baseDateColumn);
  if (!normalizeString(criteria.standardPeriod))
    missing.push(CRITERIA_FIELD_LABELS.standardPeriod);
  if (
    analysisType === 'COMPARISON' &&
    !normalizeString(criteria.comparePeriod)
  ) {
    missing.push(CRITERIA_FIELD_LABELS.comparePeriod);
  }
  if (
    analysisType === 'RANKING' &&
    (criteria.limitNum == null || criteria.limitNum <= 0)
  ) {
    missing.push(CRITERIA_FIELD_LABELS.limitNum);
  }
  if (normalizeStringList(criteria.groupBy).length === 0) {
    missing.push(CRITERIA_FIELD_LABELS.groupBy);
  }
  if (!normalizeString(criteria.sortBy))
    missing.push(CRITERIA_FIELD_LABELS.sortBy);
  if (!normalizeString(criteria.sortDirection)) {
    missing.push(CRITERIA_FIELD_LABELS.sortDirection);
  }

  return missing;
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

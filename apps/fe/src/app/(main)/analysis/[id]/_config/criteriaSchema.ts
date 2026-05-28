import type {
  CriteriaInfo,
  UpdateQuestionCriteriaRequest,
} from '@/apis/analysis';
import type { CriteriaEditValues } from '../_models/analysisViewModels';
import { normalizeString, uniqueStrings } from '../_utils/stringList';

export const ANALYSIS_TYPE_LABELS: Record<string, string> = {
  COMPARISON: '비교 분석',
  RANKING: '순위 분석',
};

type CriteriaFieldDefinition = {
  label: string;
  requiredWhenCriteriaAbsent?: boolean;
  isMissing?: (criteria: CriteriaInfo) => boolean;
};

function isComparisonCriteria(criteria: CriteriaInfo) {
  return normalizeString(criteria.analysisType) === 'COMPARISON';
}

function isRankingCriteria(criteria: CriteriaInfo) {
  return normalizeString(criteria.analysisType) === 'RANKING';
}

export const CRITERIA_FIELD_DEFINITIONS = {
  analysisType: {
    label: '분석 방식',
    isMissing: (criteria) => !normalizeString(criteria.analysisType),
  },
  metricName: {
    label: '지표',
    isMissing: (criteria) => !normalizeString(criteria.metricName),
  },
  baseDateColumn: {
    label: '날짜 기준',
    isMissing: (criteria) => !normalizeString(criteria.baseDateColumn),
  },
  standardPeriod: {
    label: '분석 기간',
    isMissing: (criteria) => !normalizeString(criteria.standardPeriod),
  },
  comparePeriod: {
    label: '비교 기간',
    isMissing: (criteria) =>
      isComparisonCriteria(criteria) &&
      !normalizeString(criteria.comparePeriod),
  },
  groupBy: {
    label: '비교 기준',
    isMissing: (criteria) => uniqueStrings(criteria.groupBy).length === 0,
  },
  sortBy: {
    label: '정렬 기준',
    isMissing: (criteria) => !normalizeString(criteria.sortBy),
  },
  sortDirection: {
    label: '정렬 순서',
    isMissing: (criteria) => !normalizeString(criteria.sortDirection),
  },
  limitNum: {
    label: '조회 개수',
    isMissing: (criteria) =>
      isRankingCriteria(criteria) &&
      (criteria.limitNum == null || criteria.limitNum <= 0),
  },
  filters: {
    label: '적용 조건',
    requiredWhenCriteriaAbsent: false,
  },
} satisfies Record<string, CriteriaFieldDefinition>;

export const CRITERIA_FIELD_LABELS = {
  analysisType: CRITERIA_FIELD_DEFINITIONS.analysisType.label,
  metricName: CRITERIA_FIELD_DEFINITIONS.metricName.label,
  baseDateColumn: CRITERIA_FIELD_DEFINITIONS.baseDateColumn.label,
  standardPeriod: CRITERIA_FIELD_DEFINITIONS.standardPeriod.label,
  comparePeriod: CRITERIA_FIELD_DEFINITIONS.comparePeriod.label,
  groupBy: CRITERIA_FIELD_DEFINITIONS.groupBy.label,
  sortBy: CRITERIA_FIELD_DEFINITIONS.sortBy.label,
  sortDirection: CRITERIA_FIELD_DEFINITIONS.sortDirection.label,
  limitNum: CRITERIA_FIELD_DEFINITIONS.limitNum.label,
  filters: CRITERIA_FIELD_DEFINITIONS.filters.label,
} as const;

const CRITERIA_FIELD_LIST = Object.values(
  CRITERIA_FIELD_DEFINITIONS,
) as CriteriaFieldDefinition[];
const REQUIRED_WHEN_CRITERIA_ABSENT = CRITERIA_FIELD_LIST.filter(
  (definition) => definition.requiredWhenCriteriaAbsent !== false,
);

export function getMissingCriteriaFields(criteria?: CriteriaInfo | null) {
  if (!criteria) {
    return REQUIRED_WHEN_CRITERIA_ABSENT.map((definition) => definition.label);
  }

  return CRITERIA_FIELD_LIST.filter((definition) =>
    definition.isMissing?.(criteria),
  ).map((definition) => definition.label);
}

function optionalString(value: string | null | undefined) {
  return normalizeString(value) ?? undefined;
}

export function createUpdateCriteriaRequestPayload(
  values: CriteriaEditValues,
): UpdateQuestionCriteriaRequest {
  return {
    baseDateColumn: optionalString(values.baseDateColumn),
    standardPeriod: optionalString(values.standardPeriod),
    comparePeriod: optionalString(values.comparePeriod),
    groupBy: values.groupBy,
    sortBy: optionalString(values.sortBy),
    sortDirection: normalizeString(values.sortDirection)?.toLowerCase(),
    limitNum: values.limitNum ?? undefined,
    filters: values.filters.map((filter) => ({
      field: filter.field,
      operator: filter.operator,
      value: filter.value,
    })),
    confirmed: true,
  };
}

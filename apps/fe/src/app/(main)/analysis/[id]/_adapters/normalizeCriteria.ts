import type {
  CriteriaInfo,
  FilterInfo,
  GetQuestionCriteriaResponse,
  UpdateQuestionCriteriaRequest,
} from '@/apis/analysis';
import type {
  AnalysisFieldViewModel,
  AnalysisFilterViewModel,
  CriteriaEditValues,
  CriteriaViewModel,
} from '../_models/analysisViewModels';
import type { AnalysisWarningViewModel } from '../_models/analysisWarningTypes';
import {
  createMissingFieldWarning,
  normalizeDataWarningItems,
  normalizeWarningText,
} from './normalizeWarnings';

const ANALYSIS_TYPE_LABELS: Record<string, string> = {
  COMPARISON: '비교 분석',
  RANKING: '순위 분석',
};

const REQUIRED_FIELD_LABELS = {
  analysisType: '분석 방식',
  metricName: '지표',
  baseDateColumn: '날짜 기준',
  standardPeriod: '분석 기간',
  comparePeriod: '비교 기간',
  groupBy: '비교 기준',
  sortBy: '정렬 기준',
  sortDirection: '정렬 순서',
} as const;

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

function createField(
  value: string | null | undefined,
  mapLabel?: (value: string) => string,
): AnalysisFieldViewModel {
  const normalized = normalizeString(value);
  return {
    value: normalized,
    label: normalized ? (mapLabel?.(normalized) ?? normalized) : '-',
    missing: normalized === null,
  };
}

function formatFilterLabel(filter: AnalysisFilterViewModel) {
  const values = [
    filter.field,
    filter.operator,
    filter.value == null ? null : String(filter.value),
  ].filter(Boolean);

  return values.length > 0 ? values.join(' ') : '조건 없음';
}

function normalizeFilters(filters: FilterInfo[] | null | undefined) {
  if (!filters?.length) return [];

  return filters.map<AnalysisFilterViewModel>((filter) => {
    const normalized = {
      field: normalizeString(filter.field),
      operator: normalizeString(filter.operator),
      value: filter.value,
      label: '',
    };

    return {
      ...normalized,
      label: formatFilterLabel(normalized),
    };
  });
}

function getMissingFields(criteria?: CriteriaInfo | null) {
  if (!criteria) return Object.values(REQUIRED_FIELD_LABELS);

  const missing: string[] = [];
  const analysisType = normalizeString(criteria.analysisType);

  if (!analysisType) missing.push(REQUIRED_FIELD_LABELS.analysisType);
  if (!normalizeString(criteria.metricName))
    missing.push(REQUIRED_FIELD_LABELS.metricName);
  if (!normalizeString(criteria.baseDateColumn))
    missing.push(REQUIRED_FIELD_LABELS.baseDateColumn);
  if (!normalizeString(criteria.standardPeriod))
    missing.push(REQUIRED_FIELD_LABELS.standardPeriod);
  if (
    analysisType === 'COMPARISON' &&
    !normalizeString(criteria.comparePeriod)
  ) {
    missing.push(REQUIRED_FIELD_LABELS.comparePeriod);
  }
  if (normalizeStringList(criteria.groupBy).length === 0) {
    missing.push(REQUIRED_FIELD_LABELS.groupBy);
  }
  if (!normalizeString(criteria.sortBy))
    missing.push(REQUIRED_FIELD_LABELS.sortBy);
  if (!normalizeString(criteria.sortDirection))
    missing.push(REQUIRED_FIELD_LABELS.sortDirection);

  return missing;
}

function createUnknownEnumWarnings(criteria?: CriteriaInfo | null) {
  const warnings: AnalysisWarningViewModel[] = [];
  const analysisType = normalizeString(criteria?.analysisType);

  if (analysisType && !ANALYSIS_TYPE_LABELS[analysisType]) {
    const warning = normalizeWarningText(
      `UNKNOWN_ANALYSIS_TYPE_${analysisType}`,
      'criteria',
      ['analysisType'],
    );
    if (warning) warnings.push(warning);
  }

  return warnings;
}

export function normalizeCriteria(
  response: GetQuestionCriteriaResponse,
): CriteriaViewModel {
  const criteria = response.criteria;
  const analysisType = createField(
    criteria?.analysisType,
    (value) => ANALYSIS_TYPE_LABELS[value] ?? value,
  );
  const metric = createField(criteria?.metricName);
  const dateField = createField(criteria?.baseDateColumn);
  const standardPeriod = normalizeString(criteria?.standardPeriod);
  const comparePeriod = normalizeString(criteria?.comparePeriod);
  const groupBy = normalizeStringList(criteria?.groupBy);
  const sortBy = normalizeString(criteria?.sortBy);
  const sortDirection = normalizeString(criteria?.sortDirection);
  const missingFields = getMissingFields(criteria);
  const missingWarning = createMissingFieldWarning(missingFields, 'criteria');
  const warnings = [
    ...normalizeDataWarningItems(criteria?.dataWarning, 'criteria'),
    ...normalizeStringList(criteria?.needConfirm)
      .map((field) =>
        normalizeWarningText(`확인이 필요한 필드: ${field}`, 'criteria', [
          field,
        ]),
      )
      .filter(
        (warning): warning is AnalysisWarningViewModel => warning !== null,
      ),
    ...createUnknownEnumWarnings(criteria),
    ...(missingWarning ? [missingWarning] : []),
  ];

  return {
    messageId: response.messageId,
    question: response.question,
    message: normalizeString(response.message),
    analysisType,
    metric,
    dateField,
    period: {
      standard: standardPeriod,
      compare: comparePeriod,
      label: [standardPeriod, comparePeriod].filter(Boolean).join(' / ') || '-',
    },
    groupBy,
    sort: {
      by: sortBy,
      direction: sortDirection,
      label: [sortBy, sortDirection].filter(Boolean).join(' ') || '-',
    },
    limitNum: criteria?.limitNum ?? null,
    filters: normalizeFilters(criteria?.filters),
    missingFields,
    warnings,
    createdAt: response.createdAt,
  };
}

export function createCriteriaEditValues(
  criteria: CriteriaViewModel,
): CriteriaEditValues {
  return {
    baseDateColumn: criteria.dateField.value ?? '',
    standardPeriod: criteria.period.standard ?? '',
    comparePeriod: criteria.period.compare ?? '',
    groupBy: criteria.groupBy,
    sortBy: criteria.sort.by ?? '',
    sortDirection: criteria.sort.direction ?? '',
    limitNum: criteria.limitNum,
    filters: criteria.filters,
  };
}

export function createUpdateCriteriaRequest(
  values: CriteriaEditValues,
): UpdateQuestionCriteriaRequest {
  return {
    baseDateColumn: values.baseDateColumn || undefined,
    standardPeriod: values.standardPeriod || undefined,
    comparePeriod: values.comparePeriod || undefined,
    groupBy: values.groupBy,
    sortBy: values.sortBy || undefined,
    sortDirection: values.sortDirection || undefined,
    limitNum: values.limitNum ?? undefined,
    filters: values.filters.map((filter) => ({
      field: filter.field,
      operator: filter.operator,
      value: filter.value,
    })),
    confirmed: true,
  };
}

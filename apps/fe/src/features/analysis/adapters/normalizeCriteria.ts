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
} from '@/features/analysis/models/analysisViewModels';
import type { AnalysisWarningViewModel } from '@/features/analysis/models/analysisWarningTypes';
import {
  ANALYSIS_TYPE_LABELS,
  createUpdateCriteriaRequestPayload,
  getMissingCriteriaFields,
} from '../config/criteriaSchema';
import { normalizeString, uniqueStrings } from '../utils/stringList';
import {
  createMissingFieldWarning,
  normalizeDataWarningItems,
  normalizeWarningText,
} from './normalizeWarnings';

function normalizeSortDirection(value: string | null | undefined) {
  return normalizeString(value)?.toUpperCase() ?? null;
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
  const groupBy = uniqueStrings(criteria?.groupBy);
  const sortBy = normalizeString(criteria?.sortBy);
  const sortDirection = normalizeSortDirection(criteria?.sortDirection);
  const missingFields = getMissingCriteriaFields(criteria);
  const missingWarning = createMissingFieldWarning(missingFields, 'criteria');
  const warnings = [
    ...normalizeDataWarningItems(criteria?.dataWarning, 'criteria'),
    ...uniqueStrings(criteria?.needConfirm)
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
  return createUpdateCriteriaRequestPayload(values);
}

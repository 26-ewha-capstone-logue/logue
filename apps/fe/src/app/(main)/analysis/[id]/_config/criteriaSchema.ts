import type { CriteriaInfo } from '@/apis/analysis';

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

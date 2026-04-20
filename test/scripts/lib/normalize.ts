import type { AnalysisFilter } from '../../src/types';
import type { NormalizedCriteria } from './types';

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function normalizePeriodValue(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (['this_week', '이번 주', '금주'].includes(normalized)) {
    return 'this_week';
  }

  if (['last_week', '지난주', '전주', 'previous_week'].includes(normalized)) {
    return 'last_week';
  }

  return value;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}

function normalizeFilters(value: unknown): AnalysisFilter[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      return [];
    }

    const record = item as Record<string, unknown>;
    if (typeof record.field !== 'string' || typeof record.operator !== 'string') {
      return [];
    }

    return [
      {
        field: record.field,
        operator: record.operator,
        value: (record.value ?? null) as string | number | boolean,
      },
    ];
  });
}

export function normalizeCriteria(value: unknown): NormalizedCriteria {
  const record =
    typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  return {
    analysis_type:
      record.analysis_type === 'comparison' || record.analysis_type === 'ranking'
        ? record.analysis_type
        : null,
    metric_id: asNullableString(record.metric_id),
    metric_type: asNullableString(record.metric_type),
    date_field: asNullableString(record.date_field),
    period_standard: normalizePeriodValue(record.period_standard),
    period_compare: normalizePeriodValue(record.period_compare),
    sort_by: asNullableString(record.sort_by),
    sort_direction:
      record.sort_direction === 'asc' || record.sort_direction === 'desc'
        ? record.sort_direction
        : null,
    group_by: asStringArray(record.group_by),
    limit:
      typeof record.limit === 'number' && Number.isFinite(record.limit) ? record.limit : null,
    filters: normalizeFilters(record.filters),
    display_metrics: asStringArray(record.display_metrics),
    warnings: asStringArray(record.warnings),
    unsupported_reason: asNullableString(record.unsupported_reason),
  };
}

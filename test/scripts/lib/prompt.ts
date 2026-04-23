import type { DatasetDefinition, MetricDefinition, TestCase } from '../../src/types';

const MAX_SAMPLE_ROWS = 2;

const REQUIRED_OUTPUT_SHAPE = {
  analysis_type: 'comparison | ranking | null',
  metric_id: 'string | null',
  metric_type: 'string | null',
  date_field: 'string | null',
  period_standard: 'string | null',
  period_compare: 'string | null',
  sort_by: 'string | null',
  sort_direction: 'asc | desc | null',
  group_by: ['string'],
  limit: 'number | null',
  filters: [{ field: 'string', operator: 'string', value: 'unknown' }],
  display_metrics: ['string'],
  warnings: ['string'],
  unsupported_reason: 'string | null',
} as const;

export function buildSystemPrompt(metric: MetricDefinition): string {
  const parts = {
    role: 'You convert a Korean analytics question into AnalysisCriteria JSON. Supported types: comparison, ranking. Return JSON only.',
    preset_metric: {
      id: metric.id,
      formula: `${metric.id} = ${metric.numeratorField} / ${metric.denominatorField}`,
      label: metric.businessLabel,
      metric_type: metric.metricType,
    },
    semantic_roles: ['date', 'measure', 'dimension', 'status', 'flag', 'id'],
    rules: [
      'Return JSON only.',
      'All keys in the required output shape must be present.',
      'Use null for unavailable scalar values.',
      'Use [] for empty arrays.',
      'Use dataset field names exactly for date_field, group_by, and filters.field.',
      'For ranking requests, sort_by should be metric_value.',
      'For comparison requests about increase/decrease/drop versus a prior period, sort_by should be delta.',
      'If the question asks where the value dropped the most, use sort_direction asc because the most negative delta should come first.',
      'If the question mentions channel and device together, group_by should include both dimensions when both exist in the dataset.',
      'If the dataset uses source instead of channel, map channel intent to source and add a warning saying 채널은 source로 매핑.',
      'If the question asks top 5 or 5개, limit should be 5. If it asks for the single biggest drop, limit should be 1.',
      'For comparison results about week-over-week drop, display_metrics should include conversion_rate and delta.',
      'If a field required by the question does not exist in the dataset, set unsupported_reason to a concrete Korean explanation.',
      'If date fields are ambiguous and one cannot be chosen safely, set unsupported_reason to a concrete Korean explanation.',
      'unsupported_reason must be null when the request is supported.',
      'When the dataset is ambiguous or lacks required fields, keep the best inferred intent but set unsupported_reason.',
    ],
    examples: [
      {
        question: '이번 주 가입 전환율이 가장 낮은 채널·디바이스 top 5를 보여줘',
        result_hint: {
          analysis_type: 'ranking',
          sort_by: 'metric_value',
          sort_direction: 'asc',
          group_by: ['channel', 'device'],
          limit: 5,
        },
      },
      {
        question: '이번 주 가입 전환율이 지난주 대비 어디에서 가장 많이 떨어졌어?',
        result_hint: {
          analysis_type: 'comparison',
          sort_by: 'delta',
          sort_direction: 'asc',
          group_by: ['channel', 'device'],
          limit: 1,
          display_metrics: ['conversion_rate', 'delta'],
        },
      },
      {
        question: 'dataset C에서 이번 주 가입 전환율이 가장 낮은 채널 top 5를 보여줘',
        result_hint: {
          unsupported_reason: 'dataset C에는 기준 날짜 필드를 하나로 확정하기 어렵습니다.',
        },
      },
      {
        question: '신규/기존 유저별 가입 전환율 보여줘',
        result_hint: {
          unsupported_reason: '데이터셋에 신규/기존 유저를 구분하는 필드가 없습니다.',
        },
      },
    ],
    required_output_shape: REQUIRED_OUTPUT_SHAPE,
  };

  return JSON.stringify(parts);
}

function buildCompactSchema(dataset: DatasetDefinition) {
  return {
    id: dataset.id,
    table: dataset.tableName,
    date_fields: dataset.dateFields.map((f) => ({ name: f.name, primary: f.primary ?? false })),
    fields: dataset.fields.map((f) => `${f.name}:${f.role}`),
    sample: dataset.sampleRows.slice(0, MAX_SAMPLE_ROWS),
  };
}

export function buildUserPrompt(dataset: DatasetDefinition, testCase: TestCase): string {
  return JSON.stringify({
    dataset: buildCompactSchema(dataset),
    question: testCase.question,
  });
}

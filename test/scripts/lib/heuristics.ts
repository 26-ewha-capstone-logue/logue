import type { DatasetDefinition, TestCase } from '../../src/types';
import type { NormalizedCriteria } from './types';

function ensureUnique(values: string[]): string[] {
  return [...new Set(values)];
}

function datasetHasField(dataset: DatasetDefinition, fieldName: string): boolean {
  return dataset.fields.some((field) => field.name === fieldName);
}

export function applyDemoHeuristics(
  criteria: NormalizedCriteria,
  dataset: DatasetDefinition,
  testCase: TestCase,
): NormalizedCriteria {
  const next: NormalizedCriteria = {
    ...criteria,
    group_by: [...criteria.group_by],
    filters: [...criteria.filters],
    display_metrics: [...criteria.display_metrics],
    warnings: [...criteria.warnings],
  };
  const question = testCase.question;
  const mentionsChannel = /채널/i.test(question);
  const mentionsDevice = /디바이스/i.test(question);
  const mentionsTop5 = /top\s*5|5개/i.test(question);
  const mentionsBiggestDrop = /가장 많이 떨어|가장 많이 하락|크게 떨어진|하위/i.test(question);
  const mentionsInternalTest = /internal_test/.test(question);
  const isComparison = next.analysis_type === 'comparison';
  const isRanking = next.analysis_type === 'ranking';

  if (isRanking) {
    next.sort_by = 'metric_value';
  }

  if (isComparison) {
    next.sort_by = 'delta';
    next.sort_direction = 'asc';
    next.display_metrics = ensureUnique(['conversion_rate', 'delta']);
    if (question.includes('가장')) {
      next.limit = 1;
    }
  }

  if (mentionsTop5) {
    next.limit = 5;
  }

  if (mentionsChannel) {
    if (datasetHasField(dataset, 'channel')) {
      next.group_by.push('channel');
    } else if (datasetHasField(dataset, 'source')) {
      next.group_by.push('source');
      next.warnings.push('채널은 source로 매핑');
    }
  }

  if (mentionsDevice && datasetHasField(dataset, 'device')) {
    next.group_by.push('device');
  }

  if (isComparison && mentionsBiggestDrop && next.group_by.length === 1) {
    if (datasetHasField(dataset, 'device') && !next.group_by.includes('device')) {
      next.group_by.push('device');
    }
  }

  if (mentionsInternalTest && datasetHasField(dataset, 'account_flag')) {
    next.filters = [
      {
        field: 'account_flag',
        operator: '!=',
        value: 'internal_test',
      },
    ];
  }

  if (/구간|곳|영역|부분/.test(question) && (isComparison || isRanking) && next.group_by.length === 0) {
    const dims = dataset.fields.filter((f) => f.role === 'dimension').map((f) => f.name);
    next.group_by.push(...dims);
    next.warnings.push('구간 표현이 다소 모호하지만 채널·디바이스 기준으로 해석');
  }

  if (next.group_by.includes('source') && !next.group_by.includes('channel')) {
    if (!next.warnings.some((w) => w.includes('source로 매핑'))) {
      next.warnings.push('채널은 source로 매핑');
    }
  }

  if (dataset.id === 'dataset-c') {
    next.warnings.push('날짜 필드가 모호함');
    next.unsupported_reason = 'dataset C에는 기준 날짜 필드를 하나로 확정하기 어렵습니다.';
  }

  if (/신규\/기존 유저/.test(question) && !datasetHasField(dataset, 'user_type')) {
    next.analysis_type = 'ranking';
    next.metric_id = 'conversion_rate';
    next.unsupported_reason = '데이터셋에 신규/기존 유저를 구분하는 필드가 없습니다.';
    next.group_by = ['user_type'];
  }

  next.group_by = ensureUnique(next.group_by);
  next.display_metrics = ensureUnique(next.display_metrics);
  next.warnings = ensureUnique(next.warnings);

  if (!next.unsupported_reason) {
    next.unsupported_reason = null;
  }

  return next;
}

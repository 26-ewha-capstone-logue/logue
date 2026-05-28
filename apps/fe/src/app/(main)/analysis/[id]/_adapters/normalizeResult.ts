import type { CriteriaInfo, GetQuestionResultResponse } from '@/apis/analysis';
import type {
  QuestionResultViewModel,
  ResultCriteriaItemViewModel,
} from '../_models/analysisViewModels';
import { compactStrings, normalizeString } from '../_utils/stringList';
import { normalizeAnalysisStatusError } from './normalizeAnalysisError';
import { normalizeChartData } from './normalizeChartData';

function joinList(values: string[] | null | undefined) {
  return compactStrings(values).join(', ');
}

function createCriteriaItems(
  criteria?: CriteriaInfo | null,
): ResultCriteriaItemViewModel[] {
  if (!criteria) return [];

  return [
    ['지표', criteria.metricName],
    ['비교 기준', joinList(criteria.groupBy)],
    ['날짜 기준', criteria.baseDateColumn],
    ['분석 기간', criteria.standardPeriod],
    ['비교 기간', criteria.comparePeriod],
  ]
    .map(([label, value]) => [label, normalizeString(value)] as const)
    .filter((item): item is readonly [string, string] => item[1] !== null)
    .map(([label, value]) => ({ label, value }));
}

export function normalizeResult(
  result: GetQuestionResultResponse | null | undefined,
): QuestionResultViewModel {
  if (!result) {
    const error = normalizeAnalysisStatusError(
      'FAILED',
      '분석 결과를 불러오지 못했습니다. 다시 시도해 주세요.',
    );

    return {
      status: 'failed',
      resultId: null,
      title: error?.title ?? '분석 결과를 불러오지 못했어요',
      insight: error?.message ?? '분석 결과가 비어 있습니다.',
      tableRows: [],
      chart: normalizeChartData(null),
      criteriaItems: [],
      warnings: [],
      canRetry: error?.retryable ?? true,
      emptyMessage: '분석 결과가 비어 있습니다.',
      error,
    };
  }

  const chart = normalizeChartData(result.chartData);
  const tableRows = chart.type === 'bar' ? chart.data : [];
  const emptyMessage = chart.type === 'empty' ? chart.message : null;

  return {
    status: 'success',
    resultId: result.resultId,
    title: normalizeString(result.summaryMessage) ?? '검증이 완료되었어요.',
    insight:
      normalizeString(result.description) ??
      emptyMessage ??
      '분석 결과 설명을 찾지 못했습니다.',
    tableRows,
    chart,
    criteriaItems: createCriteriaItems(result.criteria),
    warnings: [],
    canRetry: false,
    emptyMessage,
    error: null,
  };
}

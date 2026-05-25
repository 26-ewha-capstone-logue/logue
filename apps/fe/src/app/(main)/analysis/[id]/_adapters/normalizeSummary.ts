import type { GetSummaryResponse } from '@/apis/analysis';
import type {
  SummaryKeyPointViewModel,
  SummaryViewModel,
} from '../_models/analysisViewModels';
import { compactStrings, uniqueStrings } from '../_utils/stringList';
import { normalizeWarningLines } from './normalizeWarnings';

const SUMMARY_GROUPS = [
  { name: '데이터 기준', key: 'dataCriteria' },
  { name: '지표', key: 'measure' },
  { name: '차원', key: 'dimension' },
  { name: '상태 조건', key: 'statusCondition' },
  { name: '플래그', key: 'flag' },
  { name: '식별 기준', key: 'idCriteria' },
] as const;

function asNonNegativeNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : 0;
}

export function createSummaryKeyPoints(
  summary: GetSummaryResponse | null | undefined,
): SummaryKeyPointViewModel[] {
  if (!summary) return [];

  return SUMMARY_GROUPS.flatMap((group) =>
    compactStrings(summary[group.key]).map((value) => ({
      name: group.name,
      example: value,
    })),
  );
}

export function normalizeSummary(
  summary: GetSummaryResponse | null | undefined,
): SummaryViewModel {
  const keyPoints = createSummaryKeyPoints(summary);
  const dataCriteria = compactStrings(summary?.dataCriteria);
  const measure = compactStrings(summary?.measure);
  const dimension = compactStrings(summary?.dimension);
  const statusCondition = compactStrings(summary?.statusCondition);
  const flag = compactStrings(summary?.flag);
  const idCriteria = compactStrings(summary?.idCriteria);
  const rowCount = asNonNegativeNumber(summary?.rowCount);
  const columnCount = asNonNegativeNumber(summary?.columnCount);
  const columnOptions = uniqueStrings([
    ...dataCriteria,
    ...measure,
    ...dimension,
    ...statusCondition,
    ...flag,
    ...idCriteria,
  ]);
  const emptyMessage =
    rowCount === 0 && columnCount === 0
      ? '요약할 데이터 정보를 찾지 못했습니다.'
      : keyPoints.length === 0
        ? '표시할 데이터 요약 항목이 없습니다.'
        : null;

  return {
    title: '데이터를 확인했어요',
    summaryText: `총 ${rowCount.toLocaleString()}행, ${columnCount.toLocaleString()}열의 데이터가 업로드되었어요.`,
    keyPoints,
    warnings: normalizeWarningLines(summary?.sourceDataWarning, 'summary'),
    emptyMessage,
    rowCount,
    columnCount,
    columnOptions,
    dateFieldOptions: dataCriteria,
    measureOptions: measure,
  };
}

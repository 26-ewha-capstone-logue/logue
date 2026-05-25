import type {
  BarChartViewModel,
  ChartRowViewModel,
  ChartSeriesViewModel,
  ChartTabViewModel,
  ChartViewModel,
  EmptyChartViewModel,
} from '../_models/analysisViewModels';

const EMPTY_CHART_MESSAGES: Record<EmptyChartViewModel['reason'], string> = {
  missing: '표시할 차트 데이터가 없습니다.',
  empty: '표시할 차트 데이터가 비어 있습니다.',
  invalid: '차트 데이터 형식이 올바르지 않습니다.',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function createEmptyChart(
  reason: EmptyChartViewModel['reason'],
): ChartViewModel {
  return {
    type: 'empty',
    reason,
    message: EMPTY_CHART_MESSAGES[reason],
  };
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean)
    : [];
}

function asNumberArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter(
        (item): item is number =>
          typeof item === 'number' && Number.isFinite(item),
      )
    : [];
}

function uniqueStrings(values: string[]) {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  );
}

function getChartEmptyReason(value: unknown): EmptyChartViewModel['reason'] {
  if (value == null) return 'missing';
  if (Array.isArray(value) && value.length === 0) return 'empty';
  if (isRecord(value)) {
    const tabResults = value.tabResults;
    const rows = value.rows;
    if (Array.isArray(tabResults) && tabResults.length === 0) return 'empty';
    if (rows == null && 'rows' in value) return 'empty';
    if (Array.isArray(rows) && rows.length === 0) return 'empty';
  }
  return 'invalid';
}

function normalizeTabResult(
  value: unknown,
  index: number,
): ChartTabViewModel | null {
  if (!isRecord(value)) return null;

  const chart = isRecord(value.chart) ? value.chart : null;
  if (!chart) return null;

  const labels = asStringArray(chart.labels);
  const series = Array.isArray(chart.series) ? chart.series : [];
  if (labels.length === 0 || series.length === 0) return null;

  const yKeys: ChartSeriesViewModel[] = [];
  const seriesValues: number[][] = [];

  series.forEach((item, seriesIndex) => {
    if (!isRecord(item)) return;

    const values = asNumberArray(item.values);
    if (values.length === 0) return;

    const key = `series-${seriesIndex}`;
    const name =
      typeof item.name === 'string' && item.name.trim()
        ? item.name.trim()
        : `값 ${seriesIndex + 1}`;

    yKeys.push({ key, name });
    seriesValues.push(values);
  });

  if (yKeys.length === 0) return null;

  const data = labels.map<ChartRowViewModel>((label, labelIndex) => {
    const row: ChartRowViewModel = {
      name: label || `항목 ${labelIndex + 1}`,
    };

    yKeys.forEach((seriesKey, seriesIndex) => {
      row[seriesKey.key] = seriesValues[seriesIndex]?.[labelIndex] ?? 0;
    });

    return row;
  });

  return {
    name:
      typeof value.tabName === 'string' && value.tabName.trim()
        ? value.tabName.trim()
        : `탭 ${index + 1}`,
    data,
    yKeys,
    unit:
      typeof chart.unit === 'string' && chart.unit.trim()
        ? chart.unit.trim()
        : '',
  };
}

function normalizeTabChartData(value: Record<string, unknown>) {
  const tabResults = Array.isArray(value.tabResults) ? value.tabResults : null;
  if (!tabResults) return null;

  const normalizedTabs = tabResults
    .map(normalizeTabResult)
    .filter((tab): tab is ChartTabViewModel => tab !== null);
  if (normalizedTabs.length === 0) return null;

  const rawTabs = asStringArray(value.tabs);
  const tabNames = uniqueStrings([
    ...rawTabs,
    ...normalizedTabs.map((tab) => tab.name),
  ]).filter((tabName) =>
    normalizedTabs.some((tabResult) => tabResult.name === tabName),
  );
  const defaultTab =
    typeof value.defaultTab === 'string' &&
    tabNames.includes(value.defaultTab.trim())
      ? value.defaultTab.trim()
      : normalizedTabs[0].name;
  const defaultTabResult =
    normalizedTabs.find((tab) => tab.name === defaultTab) ?? normalizedTabs[0];

  return {
    type: 'bar',
    tabs:
      tabNames.length > 0 ? tabNames : normalizedTabs.map((tab) => tab.name),
    defaultTab,
    data: defaultTabResult.data,
    xKey: 'name',
    yKeys: defaultTabResult.yKeys,
    unit: defaultTabResult.unit,
    tabResults: normalizedTabs,
    exportEnabled: value.exportEnabled === true,
  } satisfies BarChartViewModel;
}

export function normalizeChartData(value: unknown): ChartViewModel {
  if (!isRecord(value)) return createEmptyChart(getChartEmptyReason(value));

  const normalized = normalizeTabChartData(value);
  if (normalized) return normalized;

  return createEmptyChart(getChartEmptyReason(value));
}

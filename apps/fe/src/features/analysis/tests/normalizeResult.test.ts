import { describe, expect, it } from 'vitest';
import {
  emptyChartResultResponse,
  normalResultResponse,
  rowsEmptyResultResponse,
  rowsNullResultResponse,
} from '../fixtures/analysis.fixtures';
import { normalizeChartData } from '../adapters/normalizeChartData';
import { normalizeResult } from '../adapters/normalizeResult';

describe('normalizeResult', () => {
  it('creates a result view model with bar chart data', () => {
    const result = normalizeResult(normalResultResponse);

    expect(result.status).toBe('success');
    expect(result.chart.type).toBe('bar');
    expect(result.tableRows).toEqual([
      { name: 'iOS', 'series-0': 12 },
      { name: 'Android', 'series-0': 18 },
    ]);
    expect(result.criteriaItems).toContainEqual({
      label: '지표',
      value: 'conversion_rate',
    });
  });

  it('normalizes empty chartData to an empty chart model', () => {
    const result = normalizeResult(emptyChartResultResponse);

    expect(result.chart).toMatchObject({
      type: 'empty',
      reason: 'empty',
    });
    expect(result.emptyMessage).toBe('표시할 차트 데이터가 비어 있습니다.');
  });

  it('normalizes legacy rows:null chartData to an empty chart model', () => {
    const result = normalizeResult(rowsNullResultResponse);

    expect(result.chart).toMatchObject({
      type: 'empty',
      reason: 'empty',
    });
  });

  it('normalizes legacy rows:[] chartData to an empty chart model', () => {
    const result = normalizeResult(rowsEmptyResultResponse);

    expect(result.chart).toMatchObject({
      type: 'empty',
      reason: 'empty',
    });
  });

  it('normalizes null result objects to failed result view models', () => {
    const result = normalizeResult(null);

    expect(result.status).toBe('failed');
    expect(result.canRetry).toBe(true);
    expect(result.chart.type).toBe('empty');
  });
});

describe('normalizeChartData', () => {
  it('treats invalid chart shapes as empty invalid charts', () => {
    const chart = normalizeChartData({
      tabResults: [{ chart: { labels: null } }],
    });

    expect(chart).toMatchObject({
      type: 'empty',
      reason: 'invalid',
    });
  });
});

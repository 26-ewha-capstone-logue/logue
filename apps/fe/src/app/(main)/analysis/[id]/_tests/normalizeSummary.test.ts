import { describe, expect, it } from 'vitest';
import {
  normalSummaryResponse,
  summaryTextNullResponse,
} from '../_fixtures/analysis.fixtures';
import { normalizeSummary } from '../_adapters/normalizeSummary';

const EMPTY_SUMMARY_MESSAGE = '요약할 데이터 정보를 찾지 못했습니다.';

describe('normalizeSummary', () => {
  it('creates a safe summary view model from a normal response', () => {
    const summary = normalizeSummary(normalSummaryResponse);

    expect(summary.rowCount).toBe(128);
    expect(summary.columnCount).toBe(6);
    expect(summary.keyPoints).toEqual(
      expect.arrayContaining([
        { name: '데이터 기준', example: 'signup_date' },
        { name: '지표', example: 'conversion_rate' },
      ]),
    );
    expect(summary.columnOptions).toContain('channel');
    expect(summary.emptyMessage).toBeNull();
  });

  it('compacts role arrays before creating options and key points', () => {
    const summary = normalizeSummary({
      ...normalSummaryResponse,
      dataCriteria: [' signup_date ', 'signup_date', ''],
      measure: null,
      dimension: [' channel ', 'channel'],
      statusCondition: null,
      flag: null,
      idCriteria: null,
    });

    expect(
      summary.keyPoints.filter((item) => item.example === 'signup_date'),
    ).toHaveLength(1);
    expect(summary.columnOptions).toEqual(['signup_date', 'channel']);
  });

  it('keeps empty/null summary data renderable', () => {
    const summary = normalizeSummary(summaryTextNullResponse);

    expect(summary.rowCount).toBe(0);
    expect(summary.columnOptions).toEqual([]);
    expect(summary.keyPoints).toEqual([]);
    expect(summary.emptyMessage).toBe(EMPTY_SUMMARY_MESSAGE);
  });

  it('keeps null summary responses renderable', () => {
    const summary = normalizeSummary(null);

    expect(summary.rowCount).toBe(0);
    expect(summary.columnOptions).toEqual([]);
    expect(summary.keyPoints).toEqual([]);
    expect(summary.emptyMessage).toBe(EMPTY_SUMMARY_MESSAGE);
  });

  it('keeps undefined summary responses renderable', () => {
    const summary = normalizeSummary(undefined);

    expect(summary.rowCount).toBe(0);
    expect(summary.columnOptions).toEqual([]);
    expect(summary.keyPoints).toEqual([]);
    expect(summary.emptyMessage).toBe(EMPTY_SUMMARY_MESSAGE);
  });
});

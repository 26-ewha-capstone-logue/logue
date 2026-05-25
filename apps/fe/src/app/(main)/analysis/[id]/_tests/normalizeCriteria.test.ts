import { describe, expect, it } from 'vitest';
import {
  normalCriteriaResponse,
  partialNullCriteriaResponse,
  unknownWarningCodeCriteriaResponse,
  warningCodeOnlyCriteriaResponse,
} from '../_fixtures/analysis.fixtures';
import {
  createCriteriaEditValues,
  createUpdateCriteriaRequest,
  normalizeCriteria,
} from '../_adapters/normalizeCriteria';

describe('normalizeCriteria', () => {
  it('creates a criteria view model from a normal response', () => {
    const criteria = normalizeCriteria(normalCriteriaResponse);

    expect(criteria.messageId).toBe(11);
    expect(criteria.analysisType.label).toBe('비교 분석');
    expect(criteria.metric.value).toBe('conversion_rate');
    expect(criteria.groupBy).toEqual(['channel', 'device']);
    expect(criteria.missingFields).toEqual([]);
  });

  it('surfaces missing fields instead of hiding them as empty strings', () => {
    const criteria = normalizeCriteria(partialNullCriteriaResponse);

    expect(criteria.metric.missing).toBe(true);
    expect(criteria.dateField.missing).toBe(true);
    expect(criteria.missingFields).toEqual(
      expect.arrayContaining(['지표', '날짜 기준', '비교 기준', '정렬 순서']),
    );
    expect(
      criteria.warnings.some(
        (warning) => warning.code === 'MISSING_ANALYSIS_FIELDS',
      ),
    ).toBe(true);
  });

  it('maps warning-code-only criteria responses to user-facing warnings', () => {
    const criteria = normalizeCriteria(warningCodeOnlyCriteriaResponse);

    expect(criteria.warnings[0]).toMatchObject({
      code: 'QUESTION_DATA_MISMATCH',
      isKnown: true,
    });
  });

  it('keeps unknown warning codes visible', () => {
    const criteria = normalizeCriteria(unknownWarningCodeCriteriaResponse);

    expect(criteria.warnings[0]).toMatchObject({
      code: 'UNEXPECTED_WARNING_CODE',
      isKnown: false,
    });
  });

  it('converts edit values back to the existing update request contract', () => {
    const criteria = normalizeCriteria(normalCriteriaResponse);
    const request = createUpdateCriteriaRequest(
      createCriteriaEditValues(criteria),
    );

    expect(request).toMatchObject({
      baseDateColumn: 'signup_date',
      standardPeriod: '이번 주',
      comparePeriod: '지난 주',
      groupBy: ['channel', 'device'],
      confirmed: true,
    });
  });
});

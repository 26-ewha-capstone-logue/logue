import { describe, expect, it } from 'vitest';
import {
  createCriteriaEditValues,
  normalizeCriteria,
} from '../_adapters/normalizeCriteria';
import {
  createCriteriaEditRows,
  type CriteriaEditRowSpec,
  type CriteriaSingleRow,
} from '../_config/criteriaEditRows';
import { normalCriteriaResponse } from '../_fixtures/analysis.fixtures';

function findSingleRow(
  rows: CriteriaEditRowSpec[],
  key: CriteriaSingleRow['key'],
) {
  return rows.find(
    (row): row is CriteriaSingleRow => row.kind === 'single' && row.key === key,
  );
}

describe('createCriteriaEditRows', () => {
  it('keeps option origins so fixed defaults and analysis-driven values can be distinguished', () => {
    const criteria = normalizeCriteria(normalCriteriaResponse);
    const values = createCriteriaEditValues(criteria);
    const rows = createCriteriaEditRows({
      baseDateColumnOptions: ['created_at'],
      criteria,
      groupByOptions: ['channel', 'country'],
      sortByOptions: ['conversion_rate'],
      values,
    });

    const baseDateColumnRow = findSingleRow(rows, 'baseDateColumn');
    const standardPeriodRow = findSingleRow(rows, 'standardPeriod');
    const sortDirectionRow = findSingleRow(rows, 'sortDirection');

    expect(baseDateColumnRow?.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          value: 'signup_date',
          origins: ['dynamic'],
        }),
        expect.objectContaining({
          value: 'created_at',
          origins: ['dynamic'],
        }),
      ]),
    );
    expect(standardPeriodRow?.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          value: '이번 주',
          origins: ['dynamic', 'default'],
        }),
        expect.objectContaining({
          value: '이번 달',
          origins: ['default'],
        }),
      ]),
    );
    expect(sortDirectionRow?.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          value: 'ASC',
          origins: ['dynamic', 'default'],
        }),
        expect.objectContaining({
          value: 'DESC',
          origins: ['default'],
        }),
      ]),
    );
  });
});

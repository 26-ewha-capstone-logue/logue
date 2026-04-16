import type { AnalysisCriteria, TestCase } from '../../src/types';
import type { ComparisonResult, FieldAccuracyStat, NormalizedCriteria } from './types';

function sortObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortObjectKeys);
  }

  if (typeof value !== 'object' || value === null) {
    return value;
  }

  return Object.keys(value as Record<string, unknown>)
    .sort()
    .reduce<Record<string, unknown>>((accumulator, key) => {
      accumulator[key] = sortObjectKeys((value as Record<string, unknown>)[key]);
      return accumulator;
    }, {});
}

function isEqualValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(sortObjectKeys(left)) === JSON.stringify(sortObjectKeys(right));
}

export function compareExpected(
  expected: AnalysisCriteria,
  actual: NormalizedCriteria,
): ComparisonResult {
  const matchedFields: string[] = [];
  const mismatchedFields: ComparisonResult['mismatchedFields'] = [];

  for (const [field, expectedValue] of Object.entries(expected)) {
    const actualValue = actual[field as keyof NormalizedCriteria];

    if (isEqualValue(expectedValue, actualValue)) {
      matchedFields.push(field);
      continue;
    }

    mismatchedFields.push({
      field,
      expected: expectedValue,
      actual: actualValue,
    });
  }

  return { matchedFields, mismatchedFields };
}

export function createEmptyFieldAccuracy(
  expectedCases: TestCase[],
): Record<string, FieldAccuracyStat> {
  const stats: Record<string, FieldAccuracyStat> = {};

  for (const testCase of expectedCases) {
    for (const field of Object.keys(testCase.expected)) {
      if (!stats[field]) {
        stats[field] = { matched: 0, total: 0 };
      }
    }
  }

  return stats;
}

export function finalizeFieldAccuracy(stats: Record<string, FieldAccuracyStat>) {
  return Object.fromEntries(
    Object.entries(stats).map(([field, value]) => [
      field,
      {
        matched: value.matched,
        total: value.total,
        accuracy: value.total === 0 ? 0 : Number((value.matched / value.total).toFixed(4)),
      },
    ]),
  );
}

import type { AnalysisCriteria } from '../../src/types';

export type NormalizedCriteria = Required<AnalysisCriteria>;

export interface FieldAccuracyStat {
  matched: number;
  total: number;
}

export interface ComparisonResult {
  matchedFields: string[];
  mismatchedFields: Array<{
    field: string;
    expected: unknown;
    actual: unknown;
  }>;
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

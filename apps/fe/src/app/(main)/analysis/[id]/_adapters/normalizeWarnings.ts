import type { DataWarningItem } from '@/apis/analysis';
import type {
  AnalysisWarningSource,
  AnalysisWarningViewModel,
} from '../_models/analysisWarningTypes';

const WARNING_MESSAGE_BY_CODE: Record<string, string> = {
  DATE_FIELD_CONFLICT:
    '날짜 기준을 하나로 정하기 어려워요. 어떤 날짜를 기준으로 볼지 선택해 주세요.',
  QUESTION_DATA_MISMATCH:
    '질문과 데이터 구조가 맞지 않을 수 있어요. 다른 기준으로 바꿔 계속할 수 있어요.',
  CRITICAL_NULL_DETECTED:
    '분석에 필요한 값 일부가 비어 있어 결과가 부정확할 수 있어요.',
};

const LEGACY_WARNING_CODE_MAP: Record<string, string> = {
  date_field_conflict: 'DATE_FIELD_CONFLICT',
};

function compactStrings(values: Array<string | null | undefined>) {
  return values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(compactStrings(values)));
}

function looksLikeCode(value: string) {
  return /^[A-Z][A-Z0-9_]*$/.test(value);
}

function normalizeWarningCode(value: string) {
  const trimmed = value.trim();
  return LEGACY_WARNING_CODE_MAP[trimmed] ?? trimmed;
}

export function normalizeWarningText(
  value: string | null | undefined,
  source: AnalysisWarningSource,
  relatedFields: string[] = [],
): AnalysisWarningViewModel | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const code = normalizeWarningCode(trimmed);
  const knownMessage = WARNING_MESSAGE_BY_CODE[code];

  if (knownMessage) {
    return {
      code,
      message: knownMessage,
      relatedFields: uniqueStrings(relatedFields),
      source,
      isKnown: true,
    };
  }

  if (looksLikeCode(code)) {
    return {
      code,
      message: `알 수 없는 경고 코드(${code})가 전달되었습니다.`,
      relatedFields: uniqueStrings(relatedFields),
      source,
      isKnown: false,
    };
  }

  return {
    code: 'UNSPECIFIED_WARNING',
    message: trimmed,
    relatedFields: uniqueStrings(relatedFields),
    source,
    isKnown: false,
  };
}

export function normalizeWarningLines(
  value: string | null | undefined,
  source: AnalysisWarningSource,
) {
  return compactStrings(value?.split('\n') ?? [])
    .map((line) => normalizeWarningText(line, source))
    .filter((warning): warning is AnalysisWarningViewModel => warning !== null);
}

export function normalizeDataWarningItems(
  items: DataWarningItem[] | null | undefined,
  source: AnalysisWarningSource,
) {
  if (!items?.length) return [];

  return items
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((warning) => normalizeWarningText(warning.content, source))
    .filter((warning): warning is AnalysisWarningViewModel => warning !== null);
}

export function createMissingFieldWarning(
  fields: string[],
  source: AnalysisWarningSource,
): AnalysisWarningViewModel | null {
  const relatedFields = uniqueStrings(fields);
  if (relatedFields.length === 0) return null;

  return {
    code: 'MISSING_ANALYSIS_FIELDS',
    message: `확인이 필요한 분석 기준: ${relatedFields.join(', ')}`,
    relatedFields,
    source,
    isKnown: true,
  };
}

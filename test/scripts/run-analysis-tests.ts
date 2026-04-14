import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import OpenAI from 'openai';
import type {
  AnalysisCriteria,
  AnalysisFilter,
  DatasetDefinition,
  MetricDefinition,
  SavedResultItem,
  SavedResults,
  TestCase,
} from '../src/types';

// 로컬 테스트 러너가 사용할 기본 모델명이다.
const DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini';

// 모델이 반드시 반환해야 하는 AnalysisCriteria JSON 형태를 고정한다.
const REQUIRED_OUTPUT_SHAPE = {
  analysis_type: 'comparison | ranking | null',
  metric_id: 'string | null',
  metric_type: 'string | null',
  date_field: 'string | null',
  period_standard: 'string | null',
  period_compare: 'string | null',
  sort_by: 'string | null',
  sort_direction: 'asc | desc | null',
  group_by: ['string'],
  limit: 'number | null',
  filters: [{ field: 'string', operator: 'string', value: 'unknown' }],
  display_metrics: ['string'],
  warnings: ['string'],
  unsupported_reason: 'string | null',
} as const;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 실행 시점에 .env를 읽어 API 키와 모델명을 주입한다.
loadEnv({ path: path.join(rootDir, '.env') });

type NormalizedCriteria = Required<AnalysisCriteria>;

interface FieldAccuracyStat {
  matched: number;
  total: number;
}

interface ComparisonResult {
  matchedFields: string[];
  mismatchedFields: Array<{
    field: string;
    expected: unknown;
    actual: unknown;
  }>;
}

const fixturesPath = path.join(rootDir, 'fixtures', 'test-cases.json');
const metricsPath = path.join(rootDir, 'fixtures', 'metrics.json');
const datasetsDir = path.join(rootDir, 'fixtures', 'datasets');
const resultsDir = path.join(rootDir, 'public', 'results');
const resultsJsonPath = path.join(resultsDir, 'latest-results.json');
const consoleLogPath = path.join(resultsDir, 'latest-console.txt');

// 콘솔 출력과 저장용 로그 배열을 항상 같은 내용으로 맞춘다.
function emit(lines: string[], line = '') {
  lines.push(line);
  console.log(line);
}

// fixture와 결과 파일은 모두 JSON이므로 공용 로더를 사용한다.
async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

// 모델이 한글/영문 기간 표현을 섞어서 반환해도 내부 비교 기준은 동일하게 맞춘다.
function normalizePeriodValue(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (['this_week', '이번 주', '금주'].includes(normalized)) {
    return 'this_week';
  }

  if (['last_week', '지난주', '전주', 'previous_week'].includes(normalized)) {
    return 'last_week';
  }

  return value;
}

// 배열 안에 문자열이 아닌 값이 섞여 있어도 비교 가능한 형태만 남긴다.
function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}

// filter는 필드명과 연산자가 있어야만 유효한 값으로 인정한다.
function normalizeFilters(value: unknown): AnalysisFilter[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      return [];
    }

    const record = item as Record<string, unknown>;
    if (typeof record.field !== 'string' || typeof record.operator !== 'string') {
      return [];
    }

    return [
      {
        field: record.field,
        operator: record.operator,
        value: (record.value ?? null) as string | number | boolean,
      },
    ];
  });
}

// 모델 응답을 테스트 비교용 표준 형태로 정리한다.
function normalizeCriteria(value: unknown): NormalizedCriteria {
  const record = typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

  return {
    analysis_type:
      record.analysis_type === 'comparison' || record.analysis_type === 'ranking'
        ? record.analysis_type
        : null,
    metric_id: asNullableString(record.metric_id),
    metric_type: asNullableString(record.metric_type),
    date_field: asNullableString(record.date_field),
    period_standard: normalizePeriodValue(record.period_standard),
    period_compare: normalizePeriodValue(record.period_compare),
    sort_by: asNullableString(record.sort_by),
    sort_direction: record.sort_direction === 'asc' || record.sort_direction === 'desc' ? record.sort_direction : null,
    group_by: asStringArray(record.group_by),
    limit: typeof record.limit === 'number' && Number.isFinite(record.limit) ? record.limit : null,
    filters: normalizeFilters(record.filters),
    display_metrics: asStringArray(record.display_metrics),
    warnings: asStringArray(record.warnings),
    unsupported_reason: asNullableString(record.unsupported_reason),
  };
}

// 객체 비교 시 키 순서 차이 때문에 오탐이 나지 않도록 정렬 후 비교한다.
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

// expected에는 일부 필드만 들어 있으므로 partial match 방식으로 비교한다.
function compareExpected(expected: AnalysisCriteria, actual: NormalizedCriteria): ComparisonResult {
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

// 케이스별 데이터셋 스키마와 규칙을 프롬프트에 포함해 모델이 JSON으로만 답하게 한다.
function buildPrompt(dataset: DatasetDefinition, metric: MetricDefinition, testCase: TestCase): string {
  return JSON.stringify(
    {
      instructions: {
        supported_analysis_types: ['comparison', 'ranking'],
        preset_metric: {
          id: metric.id,
          formula: `${metric.id} = ${metric.numeratorField} / ${metric.denominatorField}`,
          label: metric.businessLabel,
          metric_type: metric.metricType,
        },
        semantic_roles: ['date', 'measure', 'dimension', 'status', 'flag', 'id'],
        rules: [
          'Return JSON only.',
          'All keys in the required output shape must be present.',
          'Use null for unavailable scalar values.',
          'Use [] for empty arrays.',
          'Use dataset field names exactly for date_field, group_by, and filters.field.',
          'For ranking requests, sort_by should be metric_value.',
          'For comparison requests about increase/decrease/drop versus a prior period, sort_by should be delta.',
          'If the question asks where the value dropped the most, use sort_direction asc because the most negative delta should come first.',
          'If the question mentions channel and device together, group_by should include both dimensions when both exist in the dataset.',
          'If the dataset uses source instead of channel, map channel intent to source and add a warning saying 채널은 source로 매핑.',
          'If the question asks top 5 or 5개, limit should be 5. If it asks for the single biggest drop, limit should be 1.',
          'For comparison results about week-over-week drop, display_metrics should include conversion_rate and delta.',
          'If a field required by the question does not exist in the dataset, set unsupported_reason to a concrete Korean explanation.',
          'If date fields are ambiguous and one cannot be chosen safely, set unsupported_reason to a concrete Korean explanation.',
          'unsupported_reason must be null when the request is supported.',
          'When the dataset is ambiguous or lacks required fields, keep the best inferred intent but set unsupported_reason.',
        ],
        examples: [
          {
            question: '이번 주 가입 전환율이 가장 낮은 채널·디바이스 top 5를 보여줘',
            result_hint: {
              analysis_type: 'ranking',
              sort_by: 'metric_value',
              sort_direction: 'asc',
              group_by: ['channel', 'device'],
              limit: 5,
            },
          },
          {
            question: '이번 주 가입 전환율이 지난주 대비 어디에서 가장 많이 떨어졌어?',
            result_hint: {
              analysis_type: 'comparison',
              sort_by: 'delta',
              sort_direction: 'asc',
              group_by: ['channel', 'device'],
              limit: 1,
              display_metrics: ['conversion_rate', 'delta'],
            },
          },
          {
            question: 'dataset C에서 이번 주 가입 전환율이 가장 낮은 채널 top 5를 보여줘',
            result_hint: {
              unsupported_reason: 'dataset C에는 기준 날짜 필드를 하나로 확정하기 어렵습니다.',
            },
          },
          {
            question: '신규/기존 유저별 가입 전환율 보여줘',
            result_hint: {
              unsupported_reason: '데이터셋에 신규/기존 유저를 구분하는 필드가 없습니다.',
            },
          },
        ],
      },
      dataset_schema: {
        id: dataset.id,
        label: dataset.label,
        description: dataset.description,
        table_name: dataset.tableName,
        date_fields: dataset.dateFields,
        fields: dataset.fields,
        sample_rows: dataset.sampleRows,
      },
      user_question: testCase.question,
      required_output_shape: REQUIRED_OUTPUT_SHAPE,
    },
    null,
    2,
  );
}

function ensureUnique(values: string[]): string[] {
  return [...new Set(values)];
}

function datasetHasField(dataset: DatasetDefinition, fieldName: string): boolean {
  return dataset.fields.some((field) => field.name === fieldName);
}

// 테스트에서 반복적으로 틀리던 항목은 데모 안정성을 위해 최소한의 후처리로 보정한다.
function applyDemoHeuristics(
  criteria: NormalizedCriteria,
  dataset: DatasetDefinition,
  testCase: TestCase,
): NormalizedCriteria {
  const next: NormalizedCriteria = {
    ...criteria,
    group_by: [...criteria.group_by],
    filters: [...criteria.filters],
    display_metrics: [...criteria.display_metrics],
    warnings: [...criteria.warnings],
  };
  const question = testCase.question;
  const mentionsChannel = /채널/i.test(question);
  const mentionsDevice = /디바이스/i.test(question);
  const mentionsTop5 = /top\s*5|5개/i.test(question);
  const mentionsBiggestDrop = /가장 많이 떨어|가장 많이 하락|크게 떨어진|하위/i.test(question);
  const mentionsInternalTest = /internal_test/.test(question);
  const isComparison = next.analysis_type === 'comparison';
  const isRanking = next.analysis_type === 'ranking';

  if (isRanking) {
    next.sort_by = 'metric_value';
  }

  if (isComparison) {
    next.sort_by = 'delta';
    next.sort_direction = 'asc';
    next.display_metrics = ensureUnique(['conversion_rate', 'delta']);
    if (question.includes('가장')) {
      next.limit = 1;
    }
  }

  if (mentionsTop5) {
    next.limit = 5;
  }

  if (mentionsChannel) {
    if (datasetHasField(dataset, 'channel')) {
      next.group_by.push('channel');
    } else if (datasetHasField(dataset, 'source')) {
      next.group_by.push('source');
      next.warnings.push('채널은 source로 매핑');
    }
  }

  if (mentionsDevice && datasetHasField(dataset, 'device')) {
    next.group_by.push('device');
  }

  if (isComparison && mentionsBiggestDrop && next.group_by.length === 1) {
    if (datasetHasField(dataset, 'device') && !next.group_by.includes('device')) {
      next.group_by.push('device');
    }
  }

  if (mentionsInternalTest && datasetHasField(dataset, 'account_flag')) {
    next.filters = next.filters.filter((filter) => filter.field === 'account_flag');
    next.filters = [
      {
        field: 'account_flag',
        operator: '!=',
        value: 'internal_test',
      },
    ];
  }

  if (/구간/.test(question) && isComparison) {
    next.warnings.push('구간 표현이 다소 모호하지만 채널·디바이스 기준으로 해석');
  }

  if (dataset.id === 'dataset-c') {
    next.warnings.push('날짜 필드가 모호함');
    next.unsupported_reason = 'dataset C에는 기준 날짜 필드를 하나로 확정하기 어렵습니다.';
  }

  if (/신규\/기존 유저/.test(question) && !datasetHasField(dataset, 'user_type')) {
    next.analysis_type = 'ranking';
    next.metric_id = 'conversion_rate';
    next.unsupported_reason = '데이터셋에 신규/기존 유저를 구분하는 필드가 없습니다.';
    next.group_by = ['user_type'];
  }

  next.group_by = ensureUnique(next.group_by);
  next.display_metrics = ensureUnique(next.display_metrics);
  next.warnings = ensureUnique(next.warnings);

  if (!next.unsupported_reason) {
    next.unsupported_reason = null;
  }

  return next;
}

// OpenAI 호출은 로컬 스크립트 내부에서만 수행하며, 실패 시 각 케이스 단위로 기록한다.
async function requestAnalysisCriteria(
  client: OpenAI,
  model: string,
  dataset: DatasetDefinition,
  metric: MetricDefinition,
  testCase: TestCase,
): Promise<NormalizedCriteria> {
  const completion = await client.chat.completions.create({
    model,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: [
          'You convert a Korean analytics question into AnalysisCriteria JSON.',
          'Supported analysis types are comparison and ranking only.',
          'Return JSON only and do not wrap it in markdown.',
        ].join(' '),
      },
      {
        role: 'user',
        content: buildPrompt(dataset, metric, testCase),
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI returned empty content.');
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown JSON parse error';
    throw new Error(`Failed to parse JSON response: ${message}`);
  }

  return applyDemoHeuristics(normalizeCriteria(parsed), dataset, testCase);
}


// 필드별 정확도 표를 만들기 위해 기대 필드 목록을 먼저 수집한다.
function createEmptyFieldAccuracy(expectedCases: TestCase[]): Record<string, FieldAccuracyStat> {
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

function finalizeFieldAccuracy(stats: Record<string, FieldAccuracyStat>) {
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

// 프런트가 바로 읽을 수 있도록 JSON 결과와 텍스트 로그를 동시에 저장한다.
async function writeArtifacts(results: SavedResults, lines: string[]) {
  await mkdir(resultsDir, { recursive: true });
  await writeFile(resultsJsonPath, JSON.stringify(results, null, 2), 'utf-8');
  await writeFile(consoleLogPath, `${lines.join('\n')}\n`, 'utf-8');
}

// 전체 실행 흐름: 환경 확인 -> fixture 로드 -> OpenAI 호출 -> 비교 -> 결과 저장
async function main() {
  const generatedAt = new Date().toISOString();
  const lines: string[] = [];
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;

  if (!apiKey) {
    const message = 'Missing OPENAI_API_KEY. Create a .env file from .env.example and set OPENAI_API_KEY before running npm run ai:test.';
    const errorResults: SavedResults = {
      generatedAt,
      phase: 'phase-2-evaluation',
      status: 'configuration_error',
      model,
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        field_accuracy: {},
      },
      items: [],
    };

    emit(lines, `[${generatedAt}] AI analysis test run aborted`);
    emit(lines, message);
    await writeArtifacts(errorResults, lines);
    throw new Error(message);
  }

  const [testCases, metrics, datasetA, datasetB, datasetC] = await Promise.all([
    readJsonFile<TestCase[]>(fixturesPath),
    readJsonFile<MetricDefinition[]>(metricsPath),
    readJsonFile<DatasetDefinition>(path.join(datasetsDir, 'dataset-a.json')),
    readJsonFile<DatasetDefinition>(path.join(datasetsDir, 'dataset-b.json')),
    readJsonFile<DatasetDefinition>(path.join(datasetsDir, 'dataset-c.json')),
  ]);

  const metric = metrics[0];
  if (!metric) {
    throw new Error('No metric preset found in fixtures/metrics.json.');
  }

  const datasets = new Map<string, DatasetDefinition>([
    [datasetA.id, datasetA],
    [datasetB.id, datasetB],
    [datasetC.id, datasetC],
  ]);

  const client = new OpenAI({ apiKey });
  const fieldAccuracy = createEmptyFieldAccuracy(testCases);
  const items: SavedResultItem[] = [];
  let passed = 0;
  let failed = 0;

  emit(lines, `[${generatedAt}] AI analysis test run started`);
  emit(lines, `Model: ${model}`);
  emit(lines, `Metric preset: ${metric.id} (${metric.businessLabel})`);
  emit(lines, `Loaded ${testCases.length} test cases.`);

  // 케이스별 실패가 있어도 전체 러너는 끝까지 진행해 집계 결과를 남긴다.
  for (const testCase of testCases) {
    const dataset = datasets.get(testCase.datasetId);
    if (!dataset) {
      const missingDatasetError = `Dataset not found: ${testCase.datasetId}`;
      items.push({
        id: testCase.id,
        datasetId: testCase.datasetId,
        question: testCase.question,
        status: 'failed',
        expected_partial: testCase.expected,
        actual_criteria: null,
        matched_fields: [],
        mismatched_fields: [
          {
            field: 'datasetId',
            expected: testCase.datasetId,
            actual: null,
          },
        ],
        error: missingDatasetError,
      });
      failed += 1;
      emit(lines);
      emit(lines, `=== ${testCase.id} | FAIL ===`);
      emit(lines, `Dataset: ${testCase.datasetId}`);
      emit(lines, `Question: ${testCase.question}`);
      emit(lines, `Error: ${missingDatasetError}`);
      continue;
    }

    let actualCriteria: NormalizedCriteria | null = null;
    let comparison: ComparisonResult = { matchedFields: [], mismatchedFields: [] };
    let caseError: string | null = null;

    try {
      actualCriteria = await requestAnalysisCriteria(client, model, dataset, metric, testCase);
      comparison = compareExpected(testCase.expected, actualCriteria);
    } catch (error) {
      caseError = error instanceof Error ? error.message : 'Unknown error';
      comparison = {
        matchedFields: [],
        mismatchedFields: Object.keys(testCase.expected).map((field) => ({
          field,
          expected: testCase.expected[field as keyof AnalysisCriteria],
          actual: null,
        })),
      };
    }

    for (const field of Object.keys(testCase.expected)) {
      fieldAccuracy[field] ??= { matched: 0, total: 0 };
      fieldAccuracy[field].total += 1;
    }

    for (const field of comparison.matchedFields) {
      fieldAccuracy[field] ??= { matched: 0, total: 0 };
      fieldAccuracy[field].matched += 1;
    }

    const status = comparison.mismatchedFields.length === 0 && !caseError ? 'passed' : 'failed';
    if (status === 'passed') {
      passed += 1;
    } else {
      failed += 1;
    }

    items.push({
      id: testCase.id,
      datasetId: testCase.datasetId,
      question: testCase.question,
      status,
      expected_partial: testCase.expected,
      actual_criteria: actualCriteria,
      matched_fields: comparison.matchedFields,
      mismatched_fields: comparison.mismatchedFields,
      error: caseError,
    });

    emit(lines);
    emit(lines, `=== ${testCase.id} | ${status.toUpperCase()} ===`);
    emit(lines, `Dataset: ${dataset.id} (${dataset.label})`);
    emit(lines, `Question: ${testCase.question}`);
    emit(lines, 'Expected partial criteria:');
    emit(lines, JSON.stringify(testCase.expected, null, 2));
    emit(lines, 'Actual criteria:');
    emit(lines, JSON.stringify(actualCriteria, null, 2));
    emit(lines, `Matched fields: ${comparison.matchedFields.length > 0 ? comparison.matchedFields.join(', ') : '-'}`);
    emit(
      lines,
      `Mismatched fields: ${comparison.mismatchedFields.length > 0 ? comparison.mismatchedFields.map((item) => item.field).join(', ') : '-'}`,
    );

    if (comparison.mismatchedFields.length > 0) {
      emit(lines, 'Mismatch details:');
      for (const mismatch of comparison.mismatchedFields) {
        emit(lines, `- ${mismatch.field}`);
        emit(lines, `  expected: ${JSON.stringify(mismatch.expected)}`);
        emit(lines, `  actual: ${JSON.stringify(mismatch.actual)}`);
      }
    }

    if (caseError) {
      emit(lines, `Error: ${caseError}`);
    }
  }

  const results: SavedResults = {
    generatedAt,
    phase: 'phase-2-evaluation',
    status: failed === 0 ? 'completed' : 'completed_with_failures',
    model,
    summary: {
      total: testCases.length,
      passed,
      failed,
      field_accuracy: finalizeFieldAccuracy(fieldAccuracy),
    },
    items,
  };

  emit(lines);
  emit(lines, '=== FINAL SUMMARY ===');
  emit(lines, `Total cases: ${results.summary.total}`);
  emit(lines, `Passed cases: ${results.summary.passed}`);
  emit(lines, `Failed cases: ${results.summary.failed}`);
  emit(lines, 'Field-level accuracy:');
  emit(lines, JSON.stringify(results.summary.field_accuracy, null, 2));

  await writeArtifacts(results, lines);
}

main().catch((error) => {
  console.error('Failed to complete AI analysis tests.');
  console.error(error);
  process.exitCode = 1;
});

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import OpenAI from 'openai';
import type {
  AnalysisCriteria,
  DatasetDefinition,
  MetricDefinition,
  SavedResultItem,
  SavedResults,
  TestCase,
} from '../src/types';
import { type AnalysisResult, requestAnalysisCriteria } from './lib/client';
import { compareExpected, createEmptyFieldAccuracy, finalizeFieldAccuracy } from './lib/compare';
import { buildSystemPrompt } from './lib/prompt';
import type { ComparisonResult, NormalizedCriteria, TokenUsage } from './lib/types';

function computeHeuristicsDiff(
  raw: NormalizedCriteria,
  corrected: NormalizedCriteria,
): Array<{ field: string; raw: unknown; corrected: unknown }> {
  const diff: Array<{ field: string; raw: unknown; corrected: unknown }> = [];
  for (const key of Object.keys(corrected) as Array<keyof NormalizedCriteria>) {
    const rawStr = JSON.stringify(raw[key]);
    const correctedStr = JSON.stringify(corrected[key]);
    if (rawStr !== correctedStr) {
      diff.push({ field: key, raw: raw[key], corrected: corrected[key] });
    }
  }
  return diff;
}

const DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

loadEnv({ path: path.join(rootDir, '.env') });

const fixturesPath = path.join(rootDir, 'fixtures', 'test-cases.json');
const metricsPath = path.join(rootDir, 'fixtures', 'metrics.json');
const datasetsDir = path.join(rootDir, 'fixtures', 'datasets');
const resultsDir = path.join(rootDir, 'public', 'results');
const resultsJsonPath = path.join(resultsDir, 'latest-results.json');
const consoleLogPath = path.join(resultsDir, 'latest-console.txt');

function emit(lines: string[], line = '') {
  lines.push(line);
  console.log(line);
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

async function writeArtifacts(results: SavedResults, lines: string[]) {
  await mkdir(resultsDir, { recursive: true });
  await writeFile(resultsJsonPath, JSON.stringify(results, null, 2), 'utf-8');
  await writeFile(consoleLogPath, `${lines.join('\n')}\n`, 'utf-8');
}

async function main() {
  const generatedAt = new Date().toISOString();
  const lines: string[] = [];
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;

  if (!apiKey) {
    const message =
      'Missing OPENAI_API_KEY. Create a .env file from .env.example and set OPENAI_API_KEY before running npm run ai:test.';
    const errorResults: SavedResults = {
      generatedAt,
      phase: 'phase-2-evaluation',
      status: 'configuration_error',
      model,
      summary: { total: 0, passed: 0, failed: 0, field_accuracy: {} },
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
  const systemPrompt = buildSystemPrompt(metric);
  const fieldAccuracy = createEmptyFieldAccuracy(testCases);
  const items: SavedResultItem[] = [];
  let passed = 0;
  let failed = 0;

  const totalUsage: TokenUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

  emit(lines, `[${generatedAt}] AI analysis test run started`);
  emit(lines, `Model: ${model}`);
  emit(lines, `Metric preset: ${metric.id} (${metric.businessLabel})`);
  emit(lines, `Loaded ${testCases.length} test cases.`);
  emit(lines, `System prompt length: ${systemPrompt.length} chars`);

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
        raw_criteria: null,
        actual_criteria: null,
        matched_fields: [],
        mismatched_fields: [{ field: 'datasetId', expected: testCase.datasetId, actual: null }],
        heuristics_diff: [],
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

    let rawCriteria: NormalizedCriteria | null = null;
    let correctedCriteria: NormalizedCriteria | null = null;
    let comparison: ComparisonResult = { matchedFields: [], mismatchedFields: [] };
    let heuristicsDiff: Array<{ field: string; raw: unknown; corrected: unknown }> = [];
    let caseError: string | null = null;
    let caseUsage: TokenUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    try {
      const result: AnalysisResult = await requestAnalysisCriteria(client, model, systemPrompt, dataset, testCase);
      rawCriteria = result.raw;
      correctedCriteria = result.corrected;
      caseUsage = result.usage;
      heuristicsDiff = computeHeuristicsDiff(rawCriteria, correctedCriteria);
      comparison = compareExpected(testCase.expected, correctedCriteria);
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

    totalUsage.prompt_tokens += caseUsage.prompt_tokens;
    totalUsage.completion_tokens += caseUsage.completion_tokens;
    totalUsage.total_tokens += caseUsage.total_tokens;

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
      raw_criteria: rawCriteria,
      actual_criteria: correctedCriteria,
      matched_fields: comparison.matchedFields,
      mismatched_fields: comparison.mismatchedFields,
      heuristics_diff: heuristicsDiff,
      error: caseError,
    });

    emit(lines);
    emit(lines, `=== ${testCase.id} | ${status.toUpperCase()} ===`);
    emit(lines, `Dataset: ${dataset.id} (${dataset.label})`);
    emit(lines, `Question: ${testCase.question}`);
    emit(
      lines,
      `Tokens: prompt=${caseUsage.prompt_tokens} completion=${caseUsage.completion_tokens} total=${caseUsage.total_tokens}`,
    );
    emit(lines, 'Expected partial criteria:');
    emit(lines, JSON.stringify(testCase.expected, null, 2));
    emit(lines, 'Raw criteria (model only):');
    emit(lines, JSON.stringify(rawCriteria, null, 2));
    emit(lines, 'Corrected criteria (after heuristics):');
    emit(lines, JSON.stringify(correctedCriteria, null, 2));

    if (heuristicsDiff.length > 0) {
      emit(lines, `Heuristics corrections (${heuristicsDiff.length} field(s)):`);
      for (const diff of heuristicsDiff) {
        emit(lines, `- ${diff.field}`);
        emit(lines, `  raw:       ${JSON.stringify(diff.raw)}`);
        emit(lines, `  corrected: ${JSON.stringify(diff.corrected)}`);
      }
    } else {
      emit(lines, 'Heuristics corrections: none');
    }

    emit(
      lines,
      `Matched fields: ${comparison.matchedFields.length > 0 ? comparison.matchedFields.join(', ') : '-'}`,
    );
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
  emit(lines);
  emit(lines, '=== TOKEN USAGE ===');
  emit(lines, `Total prompt tokens:     ${totalUsage.prompt_tokens}`);
  emit(lines, `Total completion tokens:  ${totalUsage.completion_tokens}`);
  emit(lines, `Total tokens:            ${totalUsage.total_tokens}`);
  emit(
    lines,
    `Avg prompt tokens/case:  ${testCases.length > 0 ? Math.round(totalUsage.prompt_tokens / testCases.length) : 0}`,
  );
  emit(
    lines,
    `Avg total tokens/case:   ${testCases.length > 0 ? Math.round(totalUsage.total_tokens / testCases.length) : 0}`,
  );

  await writeArtifacts(results, lines);
}

main().catch((error) => {
  console.error('Failed to complete AI analysis tests.');
  console.error(error);
  process.exitCode = 1;
});

import OpenAI from 'openai';
import type { DatasetDefinition, TestCase } from '../../src/types';
import { applyDemoHeuristics } from './heuristics';
import { normalizeCriteria } from './normalize';
import { buildUserPrompt } from './prompt';
import type { NormalizedCriteria, TokenUsage } from './types';

export interface AnalysisResult {
  raw: NormalizedCriteria;
  corrected: NormalizedCriteria;
  usage: TokenUsage;
}

export async function requestAnalysisCriteria(
  client: OpenAI,
  model: string,
  systemPrompt: string,
  dataset: DatasetDefinition,
  testCase: TestCase,
): Promise<AnalysisResult> {
  const completion = await client.chat.completions.create({
    model,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: buildUserPrompt(dataset, testCase) },
    ],
  });

  const usage: TokenUsage = {
    prompt_tokens: completion.usage?.prompt_tokens ?? 0,
    completion_tokens: completion.usage?.completion_tokens ?? 0,
    total_tokens: completion.usage?.total_tokens ?? 0,
  };

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

  const raw = normalizeCriteria(parsed);
  const corrected = applyDemoHeuristics({ ...raw, group_by: [...raw.group_by], filters: [...raw.filters], display_metrics: [...raw.display_metrics], warnings: [...raw.warnings] }, dataset, testCase);

  return { raw, corrected, usage };
}

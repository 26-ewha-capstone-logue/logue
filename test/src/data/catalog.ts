import metricsJson from '../../fixtures/metrics.json';
import datasetAJson from '../../fixtures/datasets/dataset-a.json';
import datasetBJson from '../../fixtures/datasets/dataset-b.json';
import datasetCJson from '../../fixtures/datasets/dataset-c.json';
import testCasesJson from '../../fixtures/test-cases.json';
import type { DatasetDefinition, MetricDefinition, TestCase } from '../types';

// 프런트는 fixture JSON을 정적으로 import 해서 별도 API 없이 바로 화면에 사용한다.
export const metrics = metricsJson as MetricDefinition[];
export const datasets = [datasetAJson, datasetBJson, datasetCJson] as DatasetDefinition[];
export const testCases = testCasesJson as TestCase[];

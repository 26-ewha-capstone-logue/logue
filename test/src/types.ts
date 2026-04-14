// 질문 분석 도메인에서 쓰는 기본 semantic role 집합이다.
export type SemanticRole = 'date' | 'measure' | 'dimension' | 'status' | 'flag' | 'id';

export type AnalysisType = 'comparison' | 'ranking';

// preset metric fixture의 구조를 프런트와 스크립트가 함께 사용한다.
export interface MetricDefinition {
  id: string;
  label: string;
  description: string;
  formula: string;
  metricType: string;
  numeratorField: string;
  denominatorField: string;
  businessLabel: string;
}

export interface DatasetField {
  name: string;
  label: string;
  role: SemanticRole;
}

export interface DatasetDateField extends DatasetField {
  primary?: boolean;
}

// 데이터셋 카드와 프롬프트 생성에 모두 쓰이는 공통 스키마 정의다.
export interface DatasetDefinition {
  id: string;
  label: string;
  description: string;
  tableName: string;
  dateFields: DatasetDateField[];
  fields: DatasetField[];
  sampleRows: Record<string, string | number>[];
}

export interface AnalysisFilter {
  field: string;
  operator: string;
  value: string | number | boolean;
}

// 모델이 반환하는 질문 해석 결과의 표준 형태다.
export interface AnalysisCriteria {
  analysis_type?: AnalysisType | null;
  metric_id?: string | null;
  metric_type?: string | null;
  date_field?: string | null;
  period_standard?: string | null;
  period_compare?: string | null;
  sort_by?: string | null;
  sort_direction?: 'asc' | 'desc' | null;
  group_by?: string[];
  limit?: number | null;
  filters?: AnalysisFilter[];
  display_metrics?: string[];
  warnings?: string[];
  unsupported_reason?: string | null;
}

export interface TestCase {
  id: string;
  datasetId: string;
  question: string;
  expected: AnalysisCriteria;
  note: string;
}

// 케이스별 비교 결과를 저장해 프런트 상세 화면에서 그대로 사용한다.
export interface SavedResultItem {
  id: string;
  datasetId: string;
  question: string;
  status: 'passed' | 'failed';
  expected_partial: AnalysisCriteria;
  actual_criteria: AnalysisCriteria | null;
  matched_fields: string[];
  mismatched_fields: Array<{
    field: string;
    expected: unknown;
    actual: unknown;
  }>;
  error: string | null;
}

export interface SavedResults {
  generatedAt: string;
  phase: string;
  status: string;
  model?: string;
  // summary는 상단 KPI와 필드 정확도 테이블에 바로 연결된다.
  summary: {
    total: number;
    passed: number;
    failed: number;
    field_accuracy: Record<
      string,
      {
        matched: number;
        total: number;
        accuracy: number;
      }
    >;
  };
  items: SavedResultItem[];
}

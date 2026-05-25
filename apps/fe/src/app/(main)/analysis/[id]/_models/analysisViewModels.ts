import type {
  UserFacingAnalysisError,
  AnalysisUiStatus,
} from './analysisErrorTypes';
import type { AnalysisWarningViewModel } from './analysisWarningTypes';

export type SummaryKeyPointViewModel = {
  name: string;
  example: string;
};

export type SummaryViewModel = {
  title: string;
  summaryText: string;
  keyPoints: SummaryKeyPointViewModel[];
  warnings: AnalysisWarningViewModel[];
  emptyMessage: string | null;
  rowCount: number;
  columnCount: number;
  columnOptions: string[];
  dateFieldOptions: string[];
  measureOptions: string[];
};

export type AnalysisFieldViewModel = {
  value: string | null;
  label: string;
  missing: boolean;
};

export type AnalysisFilterViewModel = {
  field: string | null;
  operator: string | null;
  value: unknown;
  label: string;
};

export type CriteriaPeriodViewModel = {
  standard: string | null;
  compare: string | null;
  label: string;
};

export type CriteriaSortViewModel = {
  by: string | null;
  direction: string | null;
  label: string;
};

export type CriteriaViewModel = {
  messageId: number;
  question: string;
  message: string | null;
  analysisType: AnalysisFieldViewModel;
  metric: AnalysisFieldViewModel;
  dateField: AnalysisFieldViewModel;
  period: CriteriaPeriodViewModel;
  groupBy: string[];
  sort: CriteriaSortViewModel;
  limitNum: number | null;
  filters: AnalysisFilterViewModel[];
  missingFields: string[];
  warnings: AnalysisWarningViewModel[];
  createdAt: string;
};

export type CriteriaEditValues = {
  baseDateColumn: string;
  standardPeriod: string;
  comparePeriod: string;
  groupBy: string[];
  sortBy: string;
  sortDirection: string;
  limitNum: number | null;
  filters: AnalysisFilterViewModel[];
};

export type ChartSeriesViewModel = {
  key: string;
  name: string;
};

export type ChartRowViewModel = {
  name: string;
} & Record<string, number | string>;

export type ChartTabViewModel = {
  name: string;
  data: ChartRowViewModel[];
  yKeys: ChartSeriesViewModel[];
  unit: string;
};

export type BarChartViewModel = {
  type: 'bar';
  tabs: string[];
  defaultTab: string;
  data: ChartRowViewModel[];
  xKey: 'name';
  yKeys: ChartSeriesViewModel[];
  unit: string;
  tabResults: ChartTabViewModel[];
  exportEnabled: boolean;
};

export type EmptyChartViewModel = {
  type: 'empty';
  reason: 'missing' | 'empty' | 'invalid';
  message: string;
};

export type ChartViewModel = BarChartViewModel | EmptyChartViewModel;

export type ResultCriteriaItemViewModel = {
  label: string;
  value: string;
};

export type QuestionResultViewModel = {
  status: AnalysisUiStatus;
  resultId: number | null;
  title: string;
  insight: string;
  tableRows: ChartRowViewModel[];
  chart: ChartViewModel;
  criteriaItems: ResultCriteriaItemViewModel[];
  warnings: AnalysisWarningViewModel[];
  canRetry: boolean;
  emptyMessage: string | null;
  error: UserFacingAnalysisError | null;
};

export type AnalysisJobStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'RETRYING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELED'
  | 'CANCELLED'
  | (string & {});

export type CreateConversationResponse = {
  conversationId: number;
  createdAt: string;
};

export type CreateAnalysisFlowRequest = {
  dataSourceId: number;
};

export type CreateAnalysisFlowResponse = {
  analysisFlowId: number;
  dataSourceId: number;
  createdAt: string;
};

export type StartAnalysisFlowFromDataSourceResponse = {
  conversationId: number;
  analysisFlowId: number;
  dataSourceId: number;
};

export type GetSummaryResponse = {
  rowCount: number;
  columnCount: number;
  dataCriteria: string[] | null;
  measure: string[] | null;
  dimension: string[] | null;
  statusCondition: string[] | null;
  flag: string[] | null;
  idCriteria: string[] | null;
  sourceDataWarning: string | null;
  createdAt: string;
};

export type AnalysisStatusResponse = {
  status: AnalysisJobStatus;
};

export type CreateQuestionRequest = {
  question: string;
};

export type CreateQuestionResponse = {
  messageId: number;
  question: string;
  createdAt: string;
};

export type FilterInfo = {
  field?: string | null;
  operator?: string | null;
  value?: unknown;
};

export type DataWarningItem = {
  order?: number | null;
  content?: string | null;
};

export type CriteriaInfo = {
  analysisType?: string | null;
  metricName?: string | null;
  baseDateColumn?: string | null;
  standardPeriod?: string | null;
  comparePeriod?: string | null;
  groupBy?: string[] | null;
  sortBy?: string | null;
  sortDirection?: string | null;
  limitNum?: number | null;
  filters?: FilterInfo[] | null;
  dataWarning?: DataWarningItem[] | null;
  needConfirm?: string[] | null;
};

export type GetQuestionCriteriaResponse = {
  messageId: number;
  question: string;
  message?: string | null;
  criteria?: CriteriaInfo | null;
  createdAt: string;
};

export type UpdateQuestionCriteriaRequest = {
  baseDateColumn?: string;
  standardPeriod?: string;
  comparePeriod?: string;
  groupBy?: string[];
  sortBy?: string;
  sortDirection?: string;
  limitNum?: number;
  filters?: FilterInfo[];
  confirmed?: boolean;
};

export type UpdateQuestionCriteriaResponse = {
  analysisCriteriaId: number;
  confirmedAt: string;
};

export type ResultSeriesInfo = {
  name?: string | null;
  values?: number[] | null;
};

export type ResultChartInfo = {
  unit?: string | null;
  labels?: string[] | null;
  series?: ResultSeriesInfo[] | null;
};

export type ResultTabInfo = {
  tabName?: string | null;
  chart?: ResultChartInfo | null;
};

export type ResultChartDataInfo = {
  tabs?: string[] | null;
  defaultTab?: string | null;
  tabResults?: ResultTabInfo[] | null;
  exportEnabled?: boolean | null;
};

export type GetQuestionResultResponse = {
  resultId: number;
  summaryMessage?: string | null;
  description?: string | null;
  criteria?: CriteriaInfo | null;
  chartData?: ResultChartDataInfo | null;
};

export type CancelAnalysisResponse = {
  status: AnalysisJobStatus;
};

export type AnalysisFlowParams = {
  conversationId: number;
  analysisFlowId: number;
};

export type QuestionCriteriaParams = AnalysisFlowParams & {
  messageId: number;
};

export type QuestionResultParams = QuestionCriteriaParams & {
  analysisCriteriaId: number;
};

import type {
  AnalysisStatusResponse,
  GetQuestionCriteriaResponse,
  GetQuestionResultResponse,
  GetSummaryResponse,
  ResultChartDataInfo,
} from '@/apis/analysis';

export const normalSummaryResponse = {
  rowCount: 128,
  columnCount: 6,
  dataCriteria: ['signup_date'],
  measure: ['conversion_rate'],
  dimension: ['channel', 'device'],
  statusCondition: ['paid'],
  flag: ['is_internal'],
  idCriteria: ['user_id'],
  sourceDataWarning: null,
  createdAt: '2026-05-26T00:00:00',
} satisfies GetSummaryResponse;

export const summaryTextNullResponse = {
  rowCount: 0,
  columnCount: 0,
  dataCriteria: null,
  measure: null,
  dimension: [],
  statusCondition: [],
  flag: [],
  idCriteria: [],
  sourceDataWarning: null,
  createdAt: '2026-05-26T00:00:00',
} as unknown as GetSummaryResponse;

export const normalCriteriaResponse = {
  messageId: 11,
  question: '지난주 대비 전환율이 낮은 채널을 알려줘',
  message: '분석 기준을 확인해 주세요.',
  criteria: {
    analysisType: 'COMPARISON',
    metricName: 'conversion_rate',
    baseDateColumn: 'signup_date',
    standardPeriod: '이번 주',
    comparePeriod: '지난 주',
    groupBy: ['channel', 'device'],
    sortBy: 'conversion_rate_delta',
    sortDirection: 'asc',
    limitNum: null,
    filters: [{ field: 'is_internal', operator: '!=', value: true }],
    dataWarning: [],
    needConfirm: [],
  },
  createdAt: '2026-05-26T00:00:00',
} satisfies GetQuestionCriteriaResponse;

export const partialNullCriteriaResponse = {
  ...normalCriteriaResponse,
  criteria: {
    ...normalCriteriaResponse.criteria,
    metricName: null,
    baseDateColumn: null,
    groupBy: null,
    sortDirection: null,
  },
} satisfies GetQuestionCriteriaResponse;

export const warningCodeOnlyCriteriaResponse = {
  ...normalCriteriaResponse,
  criteria: {
    ...normalCriteriaResponse.criteria,
    dataWarning: [{ order: 1, content: 'QUESTION_DATA_MISMATCH' }],
    needConfirm: [],
  },
} satisfies GetQuestionCriteriaResponse;

export const unknownWarningCodeCriteriaResponse = {
  ...normalCriteriaResponse,
  criteria: {
    ...normalCriteriaResponse.criteria,
    dataWarning: [{ order: 1, content: 'UNEXPECTED_WARNING_CODE' }],
    needConfirm: [],
  },
} satisfies GetQuestionCriteriaResponse;

export const normalResultResponse = {
  resultId: 21,
  summaryMessage: '검증이 완료되었어요.',
  description: 'iOS 채널의 전환율이 지난주 대비 낮게 나타났어요.',
  criteria: normalCriteriaResponse.criteria,
  chartData: {
    tabs: ['채널'],
    defaultTab: '채널',
    tabResults: [
      {
        tabName: '채널',
        chart: {
          unit: '%',
          labels: ['iOS', 'Android'],
          series: [{ name: '전환율', values: [12, 18] }],
        },
      },
    ],
    exportEnabled: true,
  },
} satisfies GetQuestionResultResponse;

export const emptyChartResultResponse = {
  ...normalResultResponse,
  chartData: {
    tabs: [],
    defaultTab: null,
    tabResults: [],
    exportEnabled: false,
  },
} satisfies GetQuestionResultResponse;

export const rowsNullResultResponse = {
  ...normalResultResponse,
  chartData: {
    columns: ['channel', 'conversion_rate'],
    rows: null,
  } as unknown as ResultChartDataInfo,
} satisfies GetQuestionResultResponse;

export const failedStatusResponse = {
  status: 'FAILED',
} satisfies AnalysisStatusResponse;

export const canceledStatusResponse = {
  status: 'CANCELED',
} satisfies AnalysisStatusResponse;

export const llmOutputInvalidError = {
  name: 'ApiResponseError',
  response: {
    success: false,
    code: 'LLM_OUTPUT_INVALID',
    message: null,
  },
};

export const llmCallFailedError = {
  name: 'ApiResponseError',
  response: {
    success: false,
    code: 'LLM_CALL_FAILED',
    message: null,
  },
};

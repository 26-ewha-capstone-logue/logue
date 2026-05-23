import instance from '@/lib/axios';
import { unwrapApiResponse, type ApiResponse } from './types';

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
  dataCriteria: string[];
  measure: string[];
  dimension: string[];
  statusCondition: string[];
  flag: string[];
  idCriteria: string[];
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

export const analysisQueryKeys = {
  all: ['analysis'] as const,
  flow: (conversationId: number, analysisFlowId: number) =>
    [...analysisQueryKeys.all, 'flow', conversationId, analysisFlowId] as const,
  summary: (conversationId: number, analysisFlowId: number) =>
    [
      ...analysisQueryKeys.flow(conversationId, analysisFlowId),
      'summary',
    ] as const,
  summaryStatus: (conversationId: number, analysisFlowId: number) =>
    [
      ...analysisQueryKeys.summary(conversationId, analysisFlowId),
      'status',
    ] as const,
  criteria: (
    conversationId: number,
    analysisFlowId: number,
    messageId: number,
  ) =>
    [
      ...analysisQueryKeys.flow(conversationId, analysisFlowId),
      'messages',
      messageId,
      'criteria',
    ] as const,
  criteriaStatus: (
    conversationId: number,
    analysisFlowId: number,
    messageId: number,
  ) =>
    [
      ...analysisQueryKeys.criteria(conversationId, analysisFlowId, messageId),
      'status',
    ] as const,
};

function flowPath({ conversationId, analysisFlowId }: AnalysisFlowParams) {
  return `/api/anal/conversations/${conversationId}/analysisFlows/${analysisFlowId}`;
}

function criteriaPath({
  conversationId,
  analysisFlowId,
  messageId,
}: QuestionCriteriaParams) {
  return `${flowPath({ conversationId, analysisFlowId })}/messages/${messageId}/analysisCriterias`;
}

export async function createConversation() {
  const { data } = await instance.post<ApiResponse<CreateConversationResponse>>(
    '/api/anal/conversations',
  );

  return unwrapApiResponse(data);
}

export async function createAnalysisFlow(
  conversationId: number,
  request: CreateAnalysisFlowRequest,
) {
  const { data } = await instance.post<ApiResponse<CreateAnalysisFlowResponse>>(
    `/api/anal/conversations/${conversationId}/analysisFlows`,
    request,
  );

  return unwrapApiResponse(data);
}

export async function startAnalysisFlowFromDataSource(dataSourceId: number) {
  const conversation = await createConversation();
  const analysisFlow = await createAnalysisFlow(conversation.conversationId, {
    dataSourceId,
  });

  return {
    conversationId: conversation.conversationId,
    analysisFlowId: analysisFlow.analysisFlowId,
    dataSourceId: analysisFlow.dataSourceId,
  } satisfies StartAnalysisFlowFromDataSourceResponse;
}

export async function getSummaryStatus(params: AnalysisFlowParams) {
  const { data } = await instance.get<ApiResponse<AnalysisStatusResponse>>(
    `${flowPath(params)}/summary/status`,
  );

  return unwrapApiResponse(data);
}

export async function getSummary(params: AnalysisFlowParams) {
  const { data } = await instance.get<ApiResponse<GetSummaryResponse>>(
    `${flowPath(params)}/summary`,
  );

  return unwrapApiResponse(data);
}

export async function cancelSummary(params: AnalysisFlowParams) {
  const { data } = await instance.post<ApiResponse<CancelAnalysisResponse>>(
    `${flowPath(params)}/summary/cancel`,
  );

  return unwrapApiResponse(data);
}

export async function createQuestion(
  params: AnalysisFlowParams,
  request: CreateQuestionRequest,
) {
  const { data } = await instance.post<ApiResponse<CreateQuestionResponse>>(
    `${flowPath(params)}/messages`,
    request,
  );

  return unwrapApiResponse(data);
}

export async function getCriteriaStatus(params: QuestionCriteriaParams) {
  const { data } = await instance.get<ApiResponse<AnalysisStatusResponse>>(
    `${criteriaPath(params)}/status`,
  );

  return unwrapApiResponse(data);
}

export async function getCriteria(params: QuestionCriteriaParams) {
  const { data } = await instance.get<ApiResponse<GetQuestionCriteriaResponse>>(
    criteriaPath(params),
  );

  return unwrapApiResponse(data);
}

export async function updateCriteria(
  params: QuestionCriteriaParams,
  request: UpdateQuestionCriteriaRequest,
) {
  const { data } = await instance.put<
    ApiResponse<UpdateQuestionCriteriaResponse>
  >(criteriaPath(params), request);

  return unwrapApiResponse(data);
}

export async function cancelCriteria(params: QuestionCriteriaParams) {
  const { data } = await instance.post<ApiResponse<CancelAnalysisResponse>>(
    `${criteriaPath(params)}/cancel`,
  );

  return unwrapApiResponse(data);
}

export async function retryAnalysisJob(jobId: number) {
  const { data } = await instance.post<ApiResponse<unknown>>(
    `/api/anal/jobs/${jobId}/retry`,
  );

  return unwrapApiResponse(data);
}

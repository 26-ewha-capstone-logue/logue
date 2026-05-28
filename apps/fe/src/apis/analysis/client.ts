import instance from '@/lib/axios';
import { unwrapApiResponse, type ApiResponse } from '../types';
import { criteriaPath, flowPath, resultPath } from './paths';
import type {
  AnalysisFlowParams,
  AnalysisStatusResponse,
  CancelAnalysisResponse,
  CreateAnalysisFlowRequest,
  CreateAnalysisFlowResponse,
  CreateConversationResponse,
  CreateQuestionRequest,
  CreateQuestionResponse,
  GetQuestionCriteriaResponse,
  GetQuestionResultResponse,
  GetSummaryResponse,
  QuestionCriteriaParams,
  QuestionResultParams,
  StartAnalysisFlowFromDataSourceResponse,
  UpdateQuestionCriteriaRequest,
  UpdateQuestionCriteriaResponse,
} from './types';

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

  try {
    const analysisFlow = await createAnalysisFlow(conversation.conversationId, {
      dataSourceId,
    });

    return {
      conversationId: conversation.conversationId,
      analysisFlowId: analysisFlow.analysisFlowId,
      dataSourceId: analysisFlow.dataSourceId,
    } satisfies StartAnalysisFlowFromDataSourceResponse;
  } catch (error) {
    // TODO: call the conversation cleanup API once the backend exposes one.
    throw error;
  }
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

export async function getResultStatus(params: QuestionResultParams) {
  const { data } = await instance.get<ApiResponse<AnalysisStatusResponse>>(
    `${resultPath(params)}/status`,
  );

  return unwrapApiResponse(data);
}

export async function getResult(params: QuestionResultParams) {
  const { data } = await instance.get<ApiResponse<GetQuestionResultResponse>>(
    resultPath(params),
  );

  return unwrapApiResponse(data);
}

export async function cancelResult(params: QuestionResultParams) {
  const { data } = await instance.post<ApiResponse<CancelAnalysisResponse>>(
    `${resultPath(params)}/cancel`,
  );

  return unwrapApiResponse(data);
}

export async function retryAnalysisJob(jobId: number) {
  const { data } = await instance.post<ApiResponse<unknown>>(
    `/api/anal/jobs/${jobId}/retry`,
  );

  return unwrapApiResponse(data);
}

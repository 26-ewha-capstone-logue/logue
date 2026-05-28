import type {
  AnalysisFlowParams,
  QuestionCriteriaParams,
  QuestionResultParams,
} from './types';

export function flowPath({
  conversationId,
  analysisFlowId,
}: AnalysisFlowParams) {
  return `/api/anal/conversations/${conversationId}/analysisFlows/${analysisFlowId}`;
}

export function criteriaPath({
  conversationId,
  analysisFlowId,
  messageId,
}: QuestionCriteriaParams) {
  return `${flowPath({ conversationId, analysisFlowId })}/messages/${messageId}/analysisCriterias`;
}

export function resultPath(params: QuestionResultParams) {
  return `${criteriaPath(params)}/${params.analysisCriteriaId}/results`;
}

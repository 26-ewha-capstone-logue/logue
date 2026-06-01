import type {
  AnalysisFlowParams,
  QuestionCriteriaParams,
  QuestionResultParams,
} from '@/apis/analysis';

export type PendingCriteriaCancelTarget = {
  operationKey: string;
  params: QuestionCriteriaParams;
};

export type AnalysisCancelTarget =
  | {
      stage: 'summary';
      params: AnalysisFlowParams;
    }
  | {
      stage: 'criteria';
      operationKey: string;
      params: QuestionCriteriaParams;
    }
  | {
      stage: 'result';
      params: QuestionResultParams;
    };

type GetAnalysisCancelTargetParams = {
  analysisFlowId: number | null;
  conversationId: number | null;
  isQuestionAnalysisPending: boolean;
  isResultAnalysisPending: boolean;
  pendingCriteriaCancelTarget: PendingCriteriaCancelTarget | null;
  pendingResultCancelParams: QuestionResultParams | null;
  summaryPending: boolean;
};

export function getResultCancelKey({
  analysisCriteriaId,
  messageId,
}: Pick<QuestionResultParams, 'analysisCriteriaId' | 'messageId'>) {
  return `${messageId}:${analysisCriteriaId}`;
}

export function getAnalysisCancelTarget({
  analysisFlowId,
  conversationId,
  isQuestionAnalysisPending,
  isResultAnalysisPending,
  pendingCriteriaCancelTarget,
  pendingResultCancelParams,
  summaryPending,
}: GetAnalysisCancelTargetParams): AnalysisCancelTarget | null {
  if (isResultAnalysisPending && pendingResultCancelParams) {
    return {
      stage: 'result',
      params: pendingResultCancelParams,
    };
  }

  if (isQuestionAnalysisPending && pendingCriteriaCancelTarget) {
    return {
      stage: 'criteria',
      operationKey: pendingCriteriaCancelTarget.operationKey,
      params: pendingCriteriaCancelTarget.params,
    };
  }

  if (summaryPending && conversationId !== null && analysisFlowId !== null) {
    return {
      stage: 'summary',
      params: { conversationId, analysisFlowId },
    };
  }

  return null;
}

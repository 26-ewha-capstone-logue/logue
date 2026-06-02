'use client';

import { useMutation } from '@tanstack/react-query';
import {
  createQuestion,
  getCriteria,
  getCriteriaStatus,
  updateCriteria,
  type QuestionCriteriaParams,
  type UpdateQuestionCriteriaRequest,
} from '@/apis/analysis';
import type { CriteriaInitialMode } from './useAnalysisChatMessages';
import { normalizeCriteria } from '@/features/analysis/adapters/normalizeCriteria';
import { useAnalysisJobPhase } from './useAnalysisJobPhase';

export type QuestionAnalysisVariables = {
  initialMode: CriteriaInitialMode;
  operationKey: string;
  targetConversationId: number;
  targetAnalysisFlowId: number;
  question: string;
};

export type UpdateCriteriaVariables = {
  targetConversationId: number;
  targetAnalysisFlowId: number;
  messageId: number;
  request: UpdateQuestionCriteriaRequest;
};

type UseCriteriaPhaseOptions = {
  getCriteriaErrorMessage: string;
  onQuestionCreated?: (context: {
    operationKey: string;
    params: QuestionCriteriaParams;
  }) => void;
  questionAnalysisTimeoutMs: number;
  statusPollIntervalMs: number;
};

export function useQuestionAnalysisPhase({
  getCriteriaErrorMessage,
  onQuestionCreated,
  questionAnalysisTimeoutMs,
  statusPollIntervalMs,
}: UseCriteriaPhaseOptions) {
  return useAnalysisJobPhase({
    errorMessage: getCriteriaErrorMessage,
    fetchResult: getCriteria,
    fetchStatus: getCriteriaStatus,
    intervalMs: statusPollIntervalMs,
    normalizeResult: normalizeCriteria,
    prepareParams: async ({
      targetConversationId,
      targetAnalysisFlowId,
      operationKey,
      question,
    }: QuestionAnalysisVariables) => {
      const createdQuestion = await createQuestion(
        {
          conversationId: targetConversationId,
          analysisFlowId: targetAnalysisFlowId,
        },
        { question },
      );
      const criteriaParams = {
        conversationId: targetConversationId,
        analysisFlowId: targetAnalysisFlowId,
        messageId: createdQuestion.messageId,
      };
      onQuestionCreated?.({ operationKey, params: criteriaParams });

      return criteriaParams;
    },
    timeoutMs: questionAnalysisTimeoutMs,
  });
}

export function useUpdateCriteriaMutation() {
  return useMutation({
    mutationFn: (variables: UpdateCriteriaVariables) => {
      const { targetConversationId, targetAnalysisFlowId, messageId, request } =
        variables;

      return updateCriteria(
        {
          conversationId: targetConversationId,
          analysisFlowId: targetAnalysisFlowId,
          messageId,
        },
        request,
      );
    },
  });
}

export function useCriteriaPhase(options: UseCriteriaPhaseOptions) {
  return {
    questionAnalysisMutation: useQuestionAnalysisPhase(options),
    updateCriteriaMutation: useUpdateCriteriaMutation(),
  };
}

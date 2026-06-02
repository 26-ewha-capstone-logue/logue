'use client';

import { useMutation } from '@tanstack/react-query';
import {
  analysisQueryKeys,
  createQuestion,
  getCriteria,
  getCriteriaStatus,
  updateCriteria,
  type QuestionCriteriaParams,
  type UpdateQuestionCriteriaRequest,
} from '@/apis/analysis';
import type { CriteriaInitialMode } from './useAnalysisChatMessages';
import { normalizeCriteria } from '@/features/analysis/adapters/normalizeCriteria';
import { ANALYSIS_WORKFLOW_MESSAGES } from '../config/analysisWorkflowMessages';
import { useAnalysisQueryJobPhase } from './useAnalysisQueryJobPhase';

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
  enabled: boolean;
  getCriteriaErrorMessage: string;
  params: QuestionCriteriaParams | null;
  questionAnalysisTimeoutMs: number;
  statusPollIntervalMs: number;
};

export type QuestionAnalysisContext = {
  initialMode: CriteriaInitialMode;
  operationKey: string;
  params: QuestionCriteriaParams;
};

export function useCreateQuestionMutation() {
  return useMutation({
    mutationFn: async ({
      initialMode,
      operationKey,
      targetConversationId,
      targetAnalysisFlowId,
      question,
    }: QuestionAnalysisVariables): Promise<QuestionAnalysisContext> => {
      const createdQuestion = await createQuestion(
        {
          conversationId: targetConversationId,
          analysisFlowId: targetAnalysisFlowId,
        },
        { question },
      );

      return {
        initialMode,
        operationKey,
        params: {
          conversationId: targetConversationId,
          analysisFlowId: targetAnalysisFlowId,
          messageId: createdQuestion.messageId,
        },
      };
    },
  });
}

export function useQuestionAnalysisPhase({
  enabled,
  getCriteriaErrorMessage,
  params,
  questionAnalysisTimeoutMs,
  statusPollIntervalMs,
}: UseCriteriaPhaseOptions) {
  return useAnalysisQueryJobPhase({
    enabled,
    failedMessage: getCriteriaErrorMessage,
    fetchResult: getCriteria,
    fetchStatus: getCriteriaStatus,
    getResultErrorMessage: getCriteriaErrorMessage,
    invalidRouteMessage: ANALYSIS_WORKFLOW_MESSAGES.invalidRoute,
    intervalMs: statusPollIntervalMs,
    normalizeResult: normalizeCriteria,
    params,
    resultQueryKey: analysisQueryKeys.criteria(
      params?.conversationId ?? 0,
      params?.analysisFlowId ?? 0,
      params?.messageId ?? 0,
    ),
    statusQueryKey: analysisQueryKeys.criteriaStatus(
      params?.conversationId ?? 0,
      params?.analysisFlowId ?? 0,
      params?.messageId ?? 0,
    ),
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
    createQuestionMutation: useCreateQuestionMutation(),
    questionAnalysisMutation: useQuestionAnalysisPhase(options),
    updateCriteriaMutation: useUpdateCriteriaMutation(),
  };
}

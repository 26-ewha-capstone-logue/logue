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
import type { CriteriaInitialMode } from './useAnalysisChat';
import { normalizeCriteria } from '../_adapters/normalizeCriteria';
import { createPolledFetcher, useJobPoller } from './useJobPoller';

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

export function useCriteriaPhase({
  getCriteriaErrorMessage,
  onQuestionCreated,
  questionAnalysisTimeoutMs,
  statusPollIntervalMs,
}: UseCriteriaPhaseOptions) {
  const waitForCriteriaSuccess = useJobPoller<QuestionCriteriaParams>(
    getCriteriaStatus,
    {
      errorMessage: getCriteriaErrorMessage,
      intervalMs: statusPollIntervalMs,
      timeoutMs: questionAnalysisTimeoutMs,
    },
  );
  const getCriteriaAfterPolling = createPolledFetcher(
    waitForCriteriaSuccess,
    async (params: QuestionCriteriaParams) =>
      normalizeCriteria(await getCriteria(params)),
  );

  const questionAnalysisMutation = useMutation({
    mutationFn: async ({
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

      return getCriteriaAfterPolling(criteriaParams);
    },
  });

  const updateCriteriaMutation = useMutation({
    mutationFn: ({
      targetConversationId,
      targetAnalysisFlowId,
      messageId,
      request,
    }: UpdateCriteriaVariables) =>
      updateCriteria(
        {
          conversationId: targetConversationId,
          analysisFlowId: targetAnalysisFlowId,
          messageId,
        },
        request,
      ),
  });

  return {
    questionAnalysisMutation,
    updateCriteriaMutation,
  };
}

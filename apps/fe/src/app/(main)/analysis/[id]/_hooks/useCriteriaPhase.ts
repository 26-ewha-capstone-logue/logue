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
import { useJobPoller } from './useJobPoller';

export type QuestionAnalysisVariables = {
  initialMode: CriteriaInitialMode;
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
  questionAnalysisTimeoutMs: number;
  statusPollIntervalMs: number;
};

export function useCriteriaPhase({
  getCriteriaErrorMessage,
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

  const questionAnalysisMutation = useMutation({
    mutationFn: async ({
      targetConversationId,
      targetAnalysisFlowId,
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

      await waitForCriteriaSuccess(criteriaParams);
      return getCriteria(criteriaParams);
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

'use client';

import { useCallback, useRef } from 'react';
import { getAnalysisErrorMessage } from '../adapters/normalizeAnalysisError';
import { ANALYSIS_WORKFLOW_MESSAGES } from '../config/analysisWorkflowMessages';
import { ANALYSIS_JOB_POLICY } from '../config/analysisWorkflowPolicy';
import { useAnalysisJobSlot } from './useAnalysisJobSlot';
import type { CriteriaInitialMode } from './useAnalysisChatMessages';
import {
  useCreateQuestionMutation,
  useQuestionAnalysisPhase,
  type QuestionAnalysisContext,
} from './useCriteriaPhase';
import type { AnalysisWorkflowEffects } from './useAnalysisWorkflowEffects';
import type { AnalysisWorkflowRoute } from './analysisWorkflowTypes';

type UseQuestionAnalysisControllerParams = {
  cancellation: {
    consumeCanceledCriteriaOperation: (operationKey: string) => boolean;
  };
  effects: AnalysisWorkflowEffects;
  pending: {
    questionSubmissionLocked: boolean;
  };
  route: AnalysisWorkflowRoute;
};

function usePendingQuestionAnalysisPhase(
  pendingAnalysis: QuestionAnalysisContext | null,
) {
  return useQuestionAnalysisPhase({
    enabled: pendingAnalysis !== null,
    getCriteriaErrorMessage:
      ANALYSIS_WORKFLOW_MESSAGES.question.getCriteriaError,
    params: pendingAnalysis?.params ?? null,
    questionAnalysisTimeoutMs: ANALYSIS_JOB_POLICY.questionAnalysisTimeoutMs,
    statusPollIntervalMs: ANALYSIS_JOB_POLICY.statusPollIntervalMs,
  });
}

export function useQuestionAnalysisController({
  cancellation,
  effects,
  pending,
  route,
}: UseQuestionAnalysisControllerParams) {
  const { consumeCanceledCriteriaOperation } = cancellation;
  const { dispatch, messages, notify } = effects;
  const { questionSubmissionLocked } = pending;
  const { analysisFlowId, conversationId } = route;
  const operationSequenceRef = useRef(0);

  const createOperationKey = useCallback((stage: string) => {
    operationSequenceRef.current += 1;
    return `${stage}-${operationSequenceRef.current}`;
  }, []);
  const createQuestionMutation = useCreateQuestionMutation();
  const { mutate: createQuestion, isPending: questionCreatePending } =
    createQuestionMutation;
  const criteriaSlot = useAnalysisJobSlot({
    getJobKey: (pendingAnalysis: QuestionAnalysisContext) =>
      pendingAnalysis.operationKey,
    onError: (pendingAnalysis, error) => {
      if (consumeCanceledCriteriaOperation(pendingAnalysis.operationKey)) {
        return;
      }

      dispatch.questionSubmissionFailed();
      notify.showToast(error.message);
      messages.appendNotice(error.message, 'error');
    },
    onResult: (pendingAnalysis, criteria) => {
      if (consumeCanceledCriteriaOperation(pendingAnalysis.operationKey)) {
        return;
      }

      dispatch.questionSubmissionSucceeded();
      messages.appendCriteriaMessage(criteria, pendingAnalysis.initialMode);
    },
    usePhase: usePendingQuestionAnalysisPhase,
  });

  const startQuestion = useCallback(
    (
      question: string,
      appendUserMessage = true,
      initialMode: CriteriaInitialMode = 'normal',
    ) => {
      if (questionSubmissionLocked || criteriaSlot.isSlotActive()) {
        return;
      }

      if (conversationId === null || analysisFlowId === null) {
        notify.showToast(ANALYSIS_WORKFLOW_MESSAGES.invalidRoute);
        messages.appendNotice(ANALYSIS_WORKFLOW_MESSAGES.invalidRoute, 'error');
        return;
      }

      const normalizedQuestion = question.trim();
      if (!normalizedQuestion) return;

      const operationKey = createOperationKey('criteria');
      criteriaSlot.startSlot(operationKey);
      dispatch.questionSubmissionStarted();

      if (appendUserMessage) {
        messages.appendUserQuestion(normalizedQuestion);
      }

      createQuestion(
        {
          operationKey,
          targetConversationId: conversationId,
          targetAnalysisFlowId: analysisFlowId,
          question: normalizedQuestion,
          initialMode,
        },
        {
          onSuccess: (context) => {
            criteriaSlot.setSlotJob(context);
          },
          onError: (error, variables) => {
            criteriaSlot.clearSlot(variables.operationKey);
            if (consumeCanceledCriteriaOperation(variables.operationKey)) {
              return;
            }

            dispatch.questionSubmissionFailed();
            const message = getAnalysisErrorMessage(
              error,
              ANALYSIS_WORKFLOW_MESSAGES.question.createError,
            );
            notify.showToast(message);
            messages.appendNotice(message, 'error');
          },
        },
      );
    },
    [
      analysisFlowId,
      consumeCanceledCriteriaOperation,
      conversationId,
      createOperationKey,
      createQuestion,
      criteriaSlot,
      dispatch,
      messages,
      notify,
      questionSubmissionLocked,
    ],
  );
  const pendingCriteriaCancelTarget = criteriaSlot.pendingJob
    ? {
        operationKey: criteriaSlot.pendingJob.operationKey,
        params: criteriaSlot.pendingJob.params,
      }
    : null;

  return {
    clearPendingCriteriaOperation: criteriaSlot.clearSlot,
    pendingCriteriaCancelTarget,
    questionAnalysisActive:
      (questionCreatePending || criteriaSlot.phase.pending) &&
      criteriaSlot.pendingKey !== null,
    startQuestion,
  };
}

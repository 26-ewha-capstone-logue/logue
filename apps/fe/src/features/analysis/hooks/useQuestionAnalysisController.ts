'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getAnalysisErrorMessage } from '../adapters/normalizeAnalysisError';
import { ANALYSIS_WORKFLOW_MESSAGES } from '../config/analysisWorkflowMessages';
import { ANALYSIS_JOB_POLICY } from '../config/analysisWorkflowPolicy';
import type { PendingCriteriaCancelTarget } from '../utils/analysisCancelTarget';
import type { CriteriaInitialMode } from './useAnalysisChatMessages';
import {
  useCreateQuestionMutation,
  useQuestionAnalysisPhase,
  type QuestionAnalysisContext,
} from './useCriteriaPhase';
import type { AnalysisWorkflowEffects } from './useAnalysisWorkflowEffects';

type AnalysisWorkflowRoute = {
  analysisFlowId: number | null;
  conversationId: number | null;
};

type UseQuestionAnalysisControllerParams = {
  cancellation: {
    consumeCanceledCriteriaOperation: (operationKey: string) => boolean;
  };
  dispatch: AnalysisWorkflowEffects['dispatch'];
  messages: AnalysisWorkflowEffects['messages'];
  notify: AnalysisWorkflowEffects['notify'];
  pending: {
    questionSubmissionLocked: boolean;
  };
  route: AnalysisWorkflowRoute;
};

export function useQuestionAnalysisController({
  cancellation,
  dispatch,
  messages,
  notify,
  pending,
  route,
}: UseQuestionAnalysisControllerParams) {
  const { consumeCanceledCriteriaOperation } = cancellation;
  const { questionSubmissionLocked } = pending;
  const { analysisFlowId, conversationId } = route;
  const operationSequenceRef = useRef(0);
  const handledOperationKeyRef = useRef<string | null>(null);
  const [pendingOperationKey, setPendingOperationKey] = useState<string | null>(
    null,
  );
  const [pendingAnalysis, setPendingAnalysis] =
    useState<QuestionAnalysisContext | null>(null);
  const [pendingCancelTarget, setPendingCancelTarget] =
    useState<PendingCriteriaCancelTarget | null>(null);

  const createOperationKey = useCallback((stage: string) => {
    operationSequenceRef.current += 1;
    return `${stage}-${operationSequenceRef.current}`;
  }, []);
  const clearPendingOperation = useCallback((operationKey: string) => {
    setPendingOperationKey((current) =>
      current === operationKey ? null : current,
    );
    setPendingCancelTarget((current) =>
      current?.operationKey === operationKey ? null : current,
    );
    setPendingAnalysis((current) =>
      current?.operationKey === operationKey ? null : current,
    );
  }, []);

  const createQuestionMutation = useCreateQuestionMutation();
  const { mutate: createQuestion, isPending: questionCreatePending } =
    createQuestionMutation;
  const criteriaPhase = useQuestionAnalysisPhase({
    enabled: pendingAnalysis !== null,
    getCriteriaErrorMessage:
      ANALYSIS_WORKFLOW_MESSAGES.question.getCriteriaError,
    params: pendingAnalysis?.params ?? null,
    questionAnalysisTimeoutMs: ANALYSIS_JOB_POLICY.questionAnalysisTimeoutMs,
    statusPollIntervalMs: ANALYSIS_JOB_POLICY.statusPollIntervalMs,
  });

  useEffect(() => {
    if (pendingAnalysis === null) return;
    if (criteriaPhase.pending) return;
    if (handledOperationKeyRef.current === pendingAnalysis.operationKey) {
      return;
    }

    handledOperationKeyRef.current = pendingAnalysis.operationKey;

    const criteria = criteriaPhase.result;
    if (criteria) {
      queueMicrotask(() => {
        clearPendingOperation(pendingAnalysis.operationKey);
        if (consumeCanceledCriteriaOperation(pendingAnalysis.operationKey)) {
          return;
        }

        dispatch.questionSubmissionSucceeded();
        messages.appendCriteriaMessage(criteria, pendingAnalysis.initialMode);
      });
      return;
    }

    const error = criteriaPhase.error;
    if (error) {
      queueMicrotask(() => {
        clearPendingOperation(pendingAnalysis.operationKey);
        if (consumeCanceledCriteriaOperation(pendingAnalysis.operationKey)) {
          return;
        }

        dispatch.questionSubmissionFailed();
        notify.showToast(error.message);
        messages.appendNotice(error.message, 'error');
      });
    }
  }, [
    clearPendingOperation,
    consumeCanceledCriteriaOperation,
    criteriaPhase.error,
    criteriaPhase.pending,
    criteriaPhase.result,
    dispatch,
    messages,
    notify,
    pendingAnalysis,
  ]);

  const startQuestion = useCallback(
    (
      question: string,
      appendUserMessage = true,
      initialMode: CriteriaInitialMode = 'normal',
    ) => {
      if (questionSubmissionLocked) return;

      if (conversationId === null || analysisFlowId === null) {
        notify.showToast(ANALYSIS_WORKFLOW_MESSAGES.invalidRoute);
        messages.appendNotice(ANALYSIS_WORKFLOW_MESSAGES.invalidRoute, 'error');
        return;
      }

      const normalizedQuestion = question.trim();
      if (!normalizedQuestion) return;

      const operationKey = createOperationKey('criteria');
      handledOperationKeyRef.current = null;
      setPendingOperationKey(operationKey);
      setPendingAnalysis(null);
      setPendingCancelTarget(null);
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
            setPendingCancelTarget({
              operationKey: context.operationKey,
              params: context.params,
            });
            setPendingAnalysis(context);
          },
          onError: (error, variables) => {
            clearPendingOperation(variables.operationKey);
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
      clearPendingOperation,
      consumeCanceledCriteriaOperation,
      conversationId,
      createQuestion,
      createOperationKey,
      dispatch,
      messages,
      notify,
      questionSubmissionLocked,
    ],
  );

  return {
    clearPendingCriteriaOperation: clearPendingOperation,
    pendingCriteriaCancelTarget: pendingCancelTarget,
    questionAnalysisActive:
      (questionCreatePending || criteriaPhase.pending) &&
      pendingOperationKey !== null,
    startQuestion,
  };
}

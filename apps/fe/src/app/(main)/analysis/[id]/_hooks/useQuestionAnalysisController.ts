'use client';

import { useCallback, useRef, useState } from 'react';
import type { QuestionCriteriaParams } from '@/apis/analysis';
import { getAnalysisErrorMessage } from '../_adapters/normalizeAnalysisError';
import { ANALYSIS_WORKFLOW_MESSAGES } from '../_config/analysisWorkflowMessages';
import { ANALYSIS_JOB_POLICY } from '../_config/analysisWorkflowPolicy';
import type { CriteriaViewModel } from '../_models/analysisViewModels';
import type { PendingCriteriaCancelTarget } from '../_utils/analysisCancelTarget';
import type { CriteriaInitialMode } from './useAnalysisChatMessages';
import { useQuestionAnalysisPhase } from './useCriteriaPhase';

type UseQuestionAnalysisControllerParams = {
  analysisFlowId: number | null;
  appendCriteriaMessage: (
    criteria: CriteriaViewModel,
    initialMode?: CriteriaInitialMode,
  ) => void;
  appendNotice: (content: string, tone?: 'default' | 'error') => void;
  appendUserQuestion: (content: string) => void;
  consumeCanceledCriteriaOperation: (operationKey: string) => boolean;
  conversationId: number | null;
  dispatchQuestionSubmissionFinished: () => void;
  dispatchQuestionSubmissionStarted: () => void;
  questionSubmissionLocked: boolean;
  showToast: (message: string) => void;
};

export function useQuestionAnalysisController({
  analysisFlowId,
  appendCriteriaMessage,
  appendNotice,
  appendUserQuestion,
  consumeCanceledCriteriaOperation,
  conversationId,
  dispatchQuestionSubmissionFinished,
  dispatchQuestionSubmissionStarted,
  questionSubmissionLocked,
  showToast,
}: UseQuestionAnalysisControllerParams) {
  const operationSequenceRef = useRef(0);
  const [pendingOperationKey, setPendingOperationKey] = useState<string | null>(
    null,
  );
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
  }, []);

  const questionAnalysisMutation = useQuestionAnalysisPhase({
    getCriteriaErrorMessage:
      ANALYSIS_WORKFLOW_MESSAGES.question.getCriteriaError,
    onQuestionCreated: (context: {
      operationKey: string;
      params: QuestionCriteriaParams;
    }) => setPendingCancelTarget(context),
    questionAnalysisTimeoutMs: ANALYSIS_JOB_POLICY.questionAnalysisTimeoutMs,
    statusPollIntervalMs: ANALYSIS_JOB_POLICY.statusPollIntervalMs,
  });
  const { mutate: mutateQuestionAnalysis, isPending } =
    questionAnalysisMutation;

  const startQuestion = useCallback(
    (
      question: string,
      appendUserMessage = true,
      initialMode: CriteriaInitialMode = 'normal',
    ) => {
      if (questionSubmissionLocked) return;

      if (conversationId === null || analysisFlowId === null) {
        showToast(ANALYSIS_WORKFLOW_MESSAGES.invalidRoute);
        appendNotice(ANALYSIS_WORKFLOW_MESSAGES.invalidRoute, 'error');
        return;
      }

      const normalizedQuestion = question.trim();
      if (!normalizedQuestion) return;

      const operationKey = createOperationKey('criteria');
      setPendingOperationKey(operationKey);
      setPendingCancelTarget(null);
      dispatchQuestionSubmissionStarted();

      if (appendUserMessage) {
        appendUserQuestion(normalizedQuestion);
      }

      mutateQuestionAnalysis(
        {
          operationKey,
          targetConversationId: conversationId,
          targetAnalysisFlowId: analysisFlowId,
          question: normalizedQuestion,
          initialMode,
        },
        {
          onSuccess: (criteria, variables) => {
            clearPendingOperation(variables.operationKey);
            if (consumeCanceledCriteriaOperation(variables.operationKey)) {
              return;
            }

            dispatchQuestionSubmissionFinished();
            appendCriteriaMessage(criteria, variables.initialMode);
          },
          onError: (error, variables) => {
            clearPendingOperation(variables.operationKey);
            if (consumeCanceledCriteriaOperation(variables.operationKey)) {
              return;
            }

            dispatchQuestionSubmissionFinished();
            const message = getAnalysisErrorMessage(
              error,
              ANALYSIS_WORKFLOW_MESSAGES.question.createError,
            );
            showToast(message);
            appendNotice(message, 'error');
          },
        },
      );
    },
    [
      analysisFlowId,
      appendCriteriaMessage,
      appendNotice,
      appendUserQuestion,
      clearPendingOperation,
      consumeCanceledCriteriaOperation,
      conversationId,
      createOperationKey,
      dispatchQuestionSubmissionFinished,
      dispatchQuestionSubmissionStarted,
      mutateQuestionAnalysis,
      questionSubmissionLocked,
      showToast,
    ],
  );

  return {
    clearPendingCriteriaOperation: clearPendingOperation,
    pendingCriteriaCancelTarget: pendingCancelTarget,
    questionAnalysisActive: isPending && pendingOperationKey !== null,
    startQuestion,
  };
}

'use client';

import { useCallback, useRef, useState } from 'react';
import type { QuestionCriteriaParams } from '@/apis/analysis';
import { getAnalysisErrorMessage } from '../_adapters/normalizeAnalysisError';
import type { CriteriaViewModel } from '../_models/analysisViewModels';
import type { PendingCriteriaCancelTarget } from '../_utils/analysisCancelTarget';
import type { CriteriaInitialMode } from './useAnalysisChatMessages';
import { useQuestionAnalysisPhase } from './useCriteriaPhase';

const STATUS_POLL_INTERVAL_MS = 1500;
const QUESTION_ANALYSIS_TIMEOUT_MS = 120000;
const INVALID_ROUTE_MESSAGE = '분석 정보를 찾지 못했어요. 다시 시작해 주세요.';
const CREATE_QUESTION_ERROR_MESSAGE =
  '질문 분석을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.';
const GET_CRITERIA_ERROR_MESSAGE =
  '분석 기준을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';

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
    getCriteriaErrorMessage: GET_CRITERIA_ERROR_MESSAGE,
    onQuestionCreated: (context: {
      operationKey: string;
      params: QuestionCriteriaParams;
    }) => setPendingCancelTarget(context),
    questionAnalysisTimeoutMs: QUESTION_ANALYSIS_TIMEOUT_MS,
    statusPollIntervalMs: STATUS_POLL_INTERVAL_MS,
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
        showToast(INVALID_ROUTE_MESSAGE);
        appendNotice(INVALID_ROUTE_MESSAGE, 'error');
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
              CREATE_QUESTION_ERROR_MESSAGE,
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

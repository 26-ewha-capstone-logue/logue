'use client';

import { useCallback } from 'react';
import { markAnalysisStartPayloadConsumed } from '@/lib/analysisStartPayload';
import type { PromptInputValue } from '../../_components/PromptInput';
import type {
  CriteriaViewModel,
  QuestionResultViewModel,
  SummaryViewModel,
} from '../_models/analysisViewModels';
import type { CriteriaInitialMode } from './useAnalysisChatMessages';
import { useAnalysisCancelController } from './useAnalysisCancelController';
import { useAnalysisCancellationRegistry } from './useAnalysisCancellationRegistry';
import { useCriteriaConfirmationController } from './useCriteriaConfirmationController';
import { useQuestionAnalysisController } from './useQuestionAnalysisController';

const SUMMARY_NOT_READY_MESSAGE = 'CSV 데이터 요약이 끝난 뒤 질문할 수 있어요.';

type UseAnalysisWorkflowControllerParams = {
  analysisFlowId: number | null;
  appendCriteriaMessage: (
    criteria: CriteriaViewModel,
    initialMode?: CriteriaInitialMode,
  ) => void;
  appendNotice: (content: string, tone?: 'default' | 'error') => void;
  appendResultMessage: (result: QuestionResultViewModel) => void;
  appendUserQuestion: (content: string) => void;
  canAutoStartInitialQuestion: boolean;
  conversationId: number | null;
  criteriaSubmissionLocked: boolean;
  dispatchCriteriaSubmissionFinished: () => void;
  dispatchCriteriaSubmissionStarted: () => void;
  dispatchInitialQuestionStarted: () => void;
  dispatchQuestionSubmissionFinished: () => void;
  dispatchQuestionSubmissionStarted: () => void;
  hasResolvedStartPayload: boolean;
  hasStartedInitialQuestion: boolean;
  questionSubmissionLocked: boolean;
  showToast: (message: string) => void;
  summary: SummaryViewModel | undefined;
  summaryPending: boolean;
};

export function useAnalysisWorkflowController({
  analysisFlowId,
  appendCriteriaMessage,
  appendNotice,
  appendResultMessage,
  appendUserQuestion,
  canAutoStartInitialQuestion,
  conversationId,
  criteriaSubmissionLocked,
  dispatchCriteriaSubmissionFinished,
  dispatchCriteriaSubmissionStarted,
  dispatchInitialQuestionStarted,
  dispatchQuestionSubmissionFinished,
  dispatchQuestionSubmissionStarted,
  hasResolvedStartPayload,
  hasStartedInitialQuestion,
  questionSubmissionLocked,
  showToast,
  summary,
  summaryPending,
}: UseAnalysisWorkflowControllerParams) {
  const cancellationRegistry = useAnalysisCancellationRegistry();
  const questionController = useQuestionAnalysisController({
    analysisFlowId,
    appendCriteriaMessage,
    appendNotice,
    appendUserQuestion,
    consumeCanceledCriteriaOperation:
      cancellationRegistry.consumeCanceledCriteriaOperation,
    conversationId,
    dispatchQuestionSubmissionFinished,
    dispatchQuestionSubmissionStarted,
    questionSubmissionLocked,
    showToast,
  });
  const criteriaConfirmationController = useCriteriaConfirmationController({
    analysisFlowId,
    appendNotice,
    appendResultMessage,
    consumeCanceledResult: cancellationRegistry.consumeCanceledResult,
    conversationId,
    criteriaSubmissionLocked,
    dispatchCriteriaSubmissionFinished,
    dispatchCriteriaSubmissionStarted,
    showToast,
  });
  const cancelController = useAnalysisCancelController({
    analysisFlowId,
    appendNotice,
    clearPendingCriteriaOperation:
      questionController.clearPendingCriteriaOperation,
    clearPendingResultCancelParams:
      criteriaConfirmationController.clearPendingResultCancelParams,
    conversationId,
    markCriteriaCanceled: cancellationRegistry.markCriteriaCanceled,
    markResultCanceled: cancellationRegistry.markResultCanceled,
    onCriteriaCanceled: dispatchQuestionSubmissionFinished,
    onResultCanceled: dispatchCriteriaSubmissionFinished,
    pendingCriteriaCancelTarget: questionController.pendingCriteriaCancelTarget,
    pendingResultCancelParams:
      criteriaConfirmationController.pendingResultCancelParams,
    questionAnalysisActive: questionController.questionAnalysisActive,
    resultAnalysisActive: criteriaConfirmationController.resultAnalysisActive,
    showToast,
    summaryPending,
  });
  const { startQuestion } = questionController;

  const handleSubmit = useCallback(
    (value: PromptInputValue) => {
      if (!summary) {
        showToast(SUMMARY_NOT_READY_MESSAGE);
        return;
      }

      if (conversationId !== null) {
        markAnalysisStartPayloadConsumed(conversationId);
      }
      dispatchInitialQuestionStarted();
      startQuestion(value.prompt);
    },
    [
      conversationId,
      dispatchInitialQuestionStarted,
      showToast,
      startQuestion,
      summary,
    ],
  );

  const shouldShowAnalyzing =
    summaryPending ||
    questionController.questionAnalysisActive ||
    criteriaConfirmationController.updateCriteriaPending ||
    criteriaConfirmationController.resultAnalysisActive;
  const analyzingMessage = summaryPending
    ? 'CSV 데이터를 분석 중이에요'
    : criteriaConfirmationController.updateCriteriaPending
      ? '분석 기준을 확정 중이에요'
      : criteriaConfirmationController.resultAnalysisPending
        ? '최종 분석 결과를 생성 중이에요'
        : '질문을 분석 중이에요';
  const inputDisabled =
    !summary ||
    questionController.questionAnalysisActive ||
    criteriaConfirmationController.updateCriteriaPending ||
    criteriaConfirmationController.resultAnalysisActive;
  const summaryActionDisabled =
    hasStartedInitialQuestion ||
    !hasResolvedStartPayload ||
    !canAutoStartInitialQuestion ||
    questionController.questionAnalysisActive ||
    criteriaConfirmationController.updateCriteriaPending;
  const criteriaSubmitting =
    criteriaSubmissionLocked ||
    criteriaConfirmationController.updateCriteriaPending ||
    criteriaConfirmationController.resultAnalysisActive;

  return {
    analyzingMessage,
    canCancelAnalyzing: cancelController.canCancelAnalyzing,
    cancelAnalyzingDisabled: cancelController.cancelAnalyzingDisabled,
    criteriaSubmitting,
    handleCancelAnalyzing: cancelController.handleCancelAnalyzing,
    handleConfirmCriteria: criteriaConfirmationController.handleConfirmCriteria,
    handleSubmit,
    hasCanceledCurrentSummary: cancelController.hasCanceledCurrentSummary,
    inputDisabled,
    shouldShowAnalyzing,
    startQuestion,
    summaryActionDisabled,
  };
}

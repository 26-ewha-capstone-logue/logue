'use client';

import { useCallback } from 'react';
import { markAnalysisStartPayloadConsumed } from '@/lib/analysisStartPayload';
import type { PromptInputValue } from '../../_components/PromptInput';
import type { SummaryViewModel } from '../_models/analysisViewModels';
import { ANALYSIS_WORKFLOW_MESSAGES } from '../_config/analysisWorkflowMessages';
import { useAnalysisCancelController } from './useAnalysisCancelController';
import { useAnalysisCancellationRegistry } from './useAnalysisCancellationRegistry';
import { useCriteriaConfirmationController } from './useCriteriaConfirmationController';
import { useQuestionAnalysisController } from './useQuestionAnalysisController';
import type { AnalysisWorkflowEffects } from './useAnalysisWorkflowEffects';

type UseAnalysisWorkflowControllerParams = {
  analysisFlowId: number | null;
  canAutoStartInitialQuestion: boolean;
  conversationId: number | null;
  criteriaSubmissionLocked: boolean;
  effects: AnalysisWorkflowEffects;
  hasResolvedStartPayload: boolean;
  hasStartedInitialQuestion: boolean;
  questionSubmissionLocked: boolean;
  summary: SummaryViewModel | undefined;
  summaryPending: boolean;
};

export function useAnalysisWorkflowController({
  analysisFlowId,
  canAutoStartInitialQuestion,
  conversationId,
  criteriaSubmissionLocked,
  effects,
  hasResolvedStartPayload,
  hasStartedInitialQuestion,
  questionSubmissionLocked,
  summary,
  summaryPending,
}: UseAnalysisWorkflowControllerParams) {
  const { dispatch, messages, notify } = effects;
  const cancellationRegistry = useAnalysisCancellationRegistry();
  const questionController = useQuestionAnalysisController({
    analysisFlowId,
    appendCriteriaMessage: messages.appendCriteriaMessage,
    appendNotice: messages.appendNotice,
    appendUserQuestion: messages.appendUserQuestion,
    consumeCanceledCriteriaOperation:
      cancellationRegistry.consumeCanceledCriteriaOperation,
    conversationId,
    dispatchQuestionSubmissionFinished: dispatch.questionSubmissionFinished,
    dispatchQuestionSubmissionStarted: dispatch.questionSubmissionStarted,
    questionSubmissionLocked,
    showToast: notify.showToast,
  });
  const criteriaConfirmationController = useCriteriaConfirmationController({
    analysisFlowId,
    appendNotice: messages.appendNotice,
    appendResultMessage: messages.appendResultMessage,
    consumeCanceledResult: cancellationRegistry.consumeCanceledResult,
    conversationId,
    criteriaSubmissionLocked,
    dispatchCriteriaSubmissionFinished: dispatch.criteriaSubmissionFinished,
    dispatchCriteriaSubmissionStarted: dispatch.criteriaSubmissionStarted,
    showToast: notify.showToast,
  });
  const cancelController = useAnalysisCancelController({
    analysisFlowId,
    appendNotice: messages.appendNotice,
    clearPendingCriteriaOperation:
      questionController.clearPendingCriteriaOperation,
    clearPendingResultCancelParams:
      criteriaConfirmationController.clearPendingResultCancelParams,
    conversationId,
    markCriteriaCanceled: cancellationRegistry.markCriteriaCanceled,
    markResultCanceled: cancellationRegistry.markResultCanceled,
    onCriteriaCanceled: dispatch.questionSubmissionFinished,
    onResultCanceled: dispatch.criteriaSubmissionFinished,
    pendingCriteriaCancelTarget: questionController.pendingCriteriaCancelTarget,
    pendingResultCancelParams:
      criteriaConfirmationController.pendingResultCancelParams,
    questionAnalysisActive: questionController.questionAnalysisActive,
    resultAnalysisActive: criteriaConfirmationController.resultAnalysisActive,
    showToast: notify.showToast,
    summaryPending,
  });
  const { startQuestion } = questionController;

  const handleSubmit = useCallback(
    (value: PromptInputValue) => {
      if (!summary) {
        notify.showToast(ANALYSIS_WORKFLOW_MESSAGES.summary.notReady);
        return;
      }

      if (conversationId !== null) {
        markAnalysisStartPayloadConsumed(conversationId);
      }
      dispatch.initialQuestionStarted();
      startQuestion(value.prompt);
    },
    [conversationId, dispatch, notify, startQuestion, summary],
  );

  const shouldShowAnalyzing =
    summaryPending ||
    questionController.questionAnalysisActive ||
    criteriaConfirmationController.updateCriteriaPending ||
    criteriaConfirmationController.resultAnalysisActive;
  const analyzingMessage = summaryPending
    ? ANALYSIS_WORKFLOW_MESSAGES.summary.pending
    : criteriaConfirmationController.updateCriteriaPending
      ? ANALYSIS_WORKFLOW_MESSAGES.criteria.pending
      : criteriaConfirmationController.resultAnalysisPending
        ? ANALYSIS_WORKFLOW_MESSAGES.result.pending
        : ANALYSIS_WORKFLOW_MESSAGES.question.pending;
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

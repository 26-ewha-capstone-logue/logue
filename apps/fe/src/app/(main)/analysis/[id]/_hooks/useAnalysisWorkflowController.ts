'use client';

import { useCallback } from 'react';
import { markAnalysisStartPayloadConsumed } from '@/lib/analysisStartPayload';
import type { PromptInputValue } from '../../_components/PromptInput';
import type {
  CriteriaViewModel,
  QuestionResultViewModel,
  SummaryViewModel,
} from '../_models/analysisViewModels';
import { ANALYSIS_WORKFLOW_MESSAGES } from '../_config/analysisWorkflowMessages';
import type { CriteriaInitialMode } from './useAnalysisChatMessages';
import { useAnalysisCancelController } from './useAnalysisCancelController';
import { useAnalysisCancellationRegistry } from './useAnalysisCancellationRegistry';
import { useCriteriaConfirmationController } from './useCriteriaConfirmationController';
import { useQuestionAnalysisController } from './useQuestionAnalysisController';

type UseAnalysisWorkflowControllerParams = {
  flow: {
    canAutoStartInitialQuestion: boolean;
    criteriaSubmissionLocked: boolean;
    hasResolvedStartPayload: boolean;
    hasStartedInitialQuestion: boolean;
    onCriteriaSubmissionFinished: () => void;
    onCriteriaSubmissionStarted: () => void;
    onInitialQuestionStarted: () => void;
    onQuestionSubmissionFinished: () => void;
    onQuestionSubmissionStarted: () => void;
    questionSubmissionLocked: boolean;
  };
  messages: {
    appendCriteriaMessage: (
      criteria: CriteriaViewModel,
      initialMode?: CriteriaInitialMode,
    ) => void;
    appendNotice: (content: string, tone?: 'default' | 'error') => void;
    appendResultMessage: (result: QuestionResultViewModel) => void;
    appendUserQuestion: (content: string) => void;
  };
  route: {
    analysisFlowId: number | null;
    conversationId: number | null;
  };
  showToast: (message: string) => void;
  summaryState: {
    summary: SummaryViewModel | undefined;
    summaryPending: boolean;
  };
};

export function useAnalysisWorkflowController({
  flow,
  messages,
  route,
  showToast,
  summaryState,
}: UseAnalysisWorkflowControllerParams) {
  const { analysisFlowId, conversationId } = route;
  const {
    appendCriteriaMessage,
    appendNotice,
    appendResultMessage,
    appendUserQuestion,
  } = messages;
  const {
    canAutoStartInitialQuestion,
    criteriaSubmissionLocked,
    hasResolvedStartPayload,
    hasStartedInitialQuestion,
    onCriteriaSubmissionFinished,
    onCriteriaSubmissionStarted,
    onInitialQuestionStarted,
    onQuestionSubmissionFinished,
    onQuestionSubmissionStarted,
    questionSubmissionLocked,
  } = flow;
  const { summary, summaryPending } = summaryState;
  const cancellationRegistry = useAnalysisCancellationRegistry();
  const questionController = useQuestionAnalysisController({
    analysisFlowId,
    appendCriteriaMessage,
    appendNotice,
    appendUserQuestion,
    consumeCanceledCriteriaOperation:
      cancellationRegistry.consumeCanceledCriteriaOperation,
    conversationId,
    dispatchQuestionSubmissionFinished: onQuestionSubmissionFinished,
    dispatchQuestionSubmissionStarted: onQuestionSubmissionStarted,
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
    dispatchCriteriaSubmissionFinished: onCriteriaSubmissionFinished,
    dispatchCriteriaSubmissionStarted: onCriteriaSubmissionStarted,
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
    onCriteriaCanceled: onQuestionSubmissionFinished,
    onResultCanceled: onCriteriaSubmissionFinished,
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
        showToast(ANALYSIS_WORKFLOW_MESSAGES.summary.notReady);
        return;
      }

      if (conversationId !== null) {
        markAnalysisStartPayloadConsumed(conversationId);
      }
      onInitialQuestionStarted();
      startQuestion(value.prompt);
    },
    [
      conversationId,
      onInitialQuestionStarted,
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

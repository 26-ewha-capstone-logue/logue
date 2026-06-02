'use client';

import { useToast } from '@/hooks/useToast';
import { ANALYSIS_DEFAULT_PROMPT } from '../config/analysisWorkflowMessages';
import { uniqueStrings } from '../utils/stringList';
import { useAnalysisChatMessages } from './useAnalysisChatMessages';
import { useAnalysisChatViewModel } from './useAnalysisChatViewModel';
import { useAnalysisChatFlow } from './useAnalysisChatFlow';
import { useAnalysisChatSideEffects } from './useAnalysisChatSideEffects';
import { useAnalysisPageData } from './useAnalysisPageData';
import { useAnalysisWorkflowController } from './useAnalysisWorkflowController';
import { useAnalysisWorkflowEffects } from './useAnalysisWorkflowEffects';

export type {
  ChatMessage,
  CriteriaInitialMode,
} from './useAnalysisChatMessages';

type UseAnalysisChatParams = {
  hasAccessToken: boolean;
  routeConversationId: string;
};

export function useAnalysisChat({
  hasAccessToken,
  routeConversationId,
}: UseAnalysisChatParams) {
  const { toast, showToast } = useToast();
  const { actions: flowActions, flow } = useAnalysisChatFlow();
  const {
    appendCriteriaMessage,
    appendNotice,
    appendResultMessage,
    appendUserQuestion,
    initialMessage,
    restMessages,
    updateInitialMessage,
  } = useAnalysisChatMessages(ANALYSIS_DEFAULT_PROMPT);
  const {
    analysisFlowId,
    conversationId,
    dataSourceErrorMessage,
    fileName,
    initialPrompt,
    isDataSourceEmpty,
    isDataSourceLoading,
    previewTable,
    summary,
    summaryErrorMessage,
    summaryPending,
  } = useAnalysisPageData({
    defaultPrompt: ANALYSIS_DEFAULT_PROMPT,
    flowActions,
    hasAccessToken,
    routeConversationId,
  });
  const {
    canAutoStartInitialQuestion,
    criteriaSubmissionLocked,
    hasResolvedStartPayload,
    hasStartedInitialQuestion,
    questionSubmissionLocked,
  } = flow;
  const workflowEffects = useAnalysisWorkflowEffects({
    appendCriteriaMessage,
    appendNotice,
    appendResultMessage,
    appendUserQuestion,
    flowActions,
    showToast,
  });
  const workflow = useAnalysisWorkflowController({
    analysisFlowId,
    canAutoStartInitialQuestion,
    conversationId,
    criteriaSubmissionLocked,
    effects: workflowEffects,
    hasResolvedStartPayload,
    hasStartedInitialQuestion,
    questionSubmissionLocked,
    summary,
    summaryPending,
  });
  const { startQuestion } = workflow;
  const { startInitialQuestion } = useAnalysisChatSideEffects({
    canAutoStartInitialQuestion,
    conversationId,
    dispatchInitialQuestionStarted:
      workflowEffects.dispatch.initialQuestionStarted,
    fileName,
    hasAccessToken,
    hasResolvedStartPayload,
    hasStartedInitialQuestion,
    initialPrompt,
    startQuestion,
    summary,
    updateInitialMessage,
  });

  const summaryColumnOptions = summary?.columnOptions ?? [];
  const summarySortOptions = uniqueStrings([
    ...(summary?.measureOptions ?? []),
    ...summaryColumnOptions,
  ]);
  const summaryErrorMessageForView = workflow.hasCanceledCurrentSummary
    ? null
    : summaryErrorMessage;
  const messageList = useAnalysisChatViewModel({
    analyzingMessage: workflow.analyzingMessage,
    canCancelAnalyzing: workflow.canCancelAnalyzing,
    cancelAnalyzingDisabled: workflow.cancelAnalyzingDisabled,
    criteriaSubmitting: workflow.criteriaSubmitting,
    handleCancelAnalyzing: workflow.handleCancelAnalyzing,
    handleConfirmCriteria: workflow.handleConfirmCriteria,
    initialMessage,
    restMessages,
    shouldShowAnalyzing: workflow.shouldShowAnalyzing,
    startInitialQuestion,
    summary,
    summaryActionDisabled: workflow.summaryActionDisabled,
    summaryColumnOptions,
    summaryErrorMessage: summaryErrorMessageForView,
    summarySortOptions,
  });

  return {
    dataPreview: {
      errorMessage: dataSourceErrorMessage,
      isEmpty: isDataSourceEmpty,
      isLoading: isDataSourceLoading,
      table: previewTable,
    },
    input: {
      disabled: workflow.inputDisabled,
      onSubmit: workflow.handleSubmit,
    },
    messageList,
    toast,
  };
}

export type UseAnalysisChatResult = ReturnType<typeof useAnalysisChat>;

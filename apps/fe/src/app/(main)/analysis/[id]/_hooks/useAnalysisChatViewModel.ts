'use client';

import { useMemo } from 'react';
import type {
  CriteriaEditValues,
  SummaryViewModel,
} from '../_models/analysisViewModels';
import type {
  ChatMessage,
  CriteriaInitialMode,
} from './useAnalysisChatMessages';

export type AnalysisChatMessageListViewModel = {
  analyzing: {
    cancelDisabled: boolean;
    message: string;
    onCancel?: () => void;
  } | null;
  criteriaMessage: {
    baseDateColumnOptions: string[];
    groupByOptions: string[];
    isSubmitting: boolean;
    onConfirm: (messageId: number, values: CriteriaEditValues) => void;
    sortByOptions: string[];
  };
  initialMessage: ChatMessage | undefined;
  restMessages: ChatMessage[];
  summary: SummaryViewModel | undefined;
  summaryErrorMessage: string | null;
  summaryWarningActions:
    | {
        disabled: boolean;
        onContinue: () => void;
        onEdit: () => void;
      }
    | undefined;
};

type UseAnalysisChatViewModelParams = {
  analyzingMessage: string;
  canCancelAnalyzing: boolean;
  cancelAnalyzingDisabled: boolean;
  criteriaSubmitting: boolean;
  handleCancelAnalyzing: () => void;
  handleConfirmCriteria: (
    messageId: number,
    values: CriteriaEditValues,
  ) => void;
  initialMessage: ChatMessage | undefined;
  restMessages: ChatMessage[];
  shouldShowAnalyzing: boolean;
  startInitialQuestion: (initialMode?: CriteriaInitialMode) => void;
  summary: SummaryViewModel | undefined;
  summaryActionDisabled: boolean;
  summaryColumnOptions: string[];
  summaryErrorMessage: string | null;
  summarySortOptions: string[];
};

export function useAnalysisChatViewModel({
  analyzingMessage,
  canCancelAnalyzing,
  cancelAnalyzingDisabled,
  criteriaSubmitting,
  handleCancelAnalyzing,
  handleConfirmCriteria,
  initialMessage,
  restMessages,
  shouldShowAnalyzing,
  startInitialQuestion,
  summary,
  summaryActionDisabled,
  summaryColumnOptions,
  summaryErrorMessage,
  summarySortOptions,
}: UseAnalysisChatViewModelParams): AnalysisChatMessageListViewModel {
  return useMemo(
    () => ({
      analyzing: shouldShowAnalyzing
        ? {
            cancelDisabled: cancelAnalyzingDisabled,
            message: analyzingMessage,
            onCancel: canCancelAnalyzing ? handleCancelAnalyzing : undefined,
          }
        : null,
      criteriaMessage: {
        baseDateColumnOptions: summary?.dateFieldOptions.length
          ? summary.dateFieldOptions
          : summaryColumnOptions,
        groupByOptions: summaryColumnOptions,
        isSubmitting: criteriaSubmitting,
        onConfirm: handleConfirmCriteria,
        sortByOptions: summarySortOptions,
      },
      initialMessage,
      restMessages,
      summary,
      summaryErrorMessage,
      summaryWarningActions:
        summary && summary.warnings.length > 0
          ? {
              disabled: summaryActionDisabled,
              onEdit: () => startInitialQuestion('edit'),
              onContinue: () => startInitialQuestion(),
            }
          : undefined,
    }),
    [
      analyzingMessage,
      canCancelAnalyzing,
      cancelAnalyzingDisabled,
      criteriaSubmitting,
      handleCancelAnalyzing,
      handleConfirmCriteria,
      initialMessage,
      restMessages,
      shouldShowAnalyzing,
      startInitialQuestion,
      summary,
      summaryActionDisabled,
      summaryColumnOptions,
      summaryErrorMessage,
      summarySortOptions,
    ],
  );
}

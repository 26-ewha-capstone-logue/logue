'use client';

import { useCallback, useEffect } from 'react';
import { markAnalysisStartPayloadConsumed } from '@/lib/analysisStartPayload';
import type { SummaryViewModel } from '@/features/analysis/models/analysisViewModels';
import type { CriteriaInitialMode } from './useAnalysisChatMessages';

type StartQuestion = (
  question: string,
  appendUserMessage?: boolean,
  initialMode?: CriteriaInitialMode,
) => void;

type UseAnalysisChatSideEffectsParams = {
  canAutoStartInitialQuestion: boolean;
  conversationId: number | null;
  dispatchInitialQuestionStarted: () => void;
  fileName: string | null;
  hasAccessToken: boolean;
  hasResolvedStartPayload: boolean;
  hasStartedInitialQuestion: boolean;
  initialPrompt: string;
  startQuestion: StartQuestion;
  summary: SummaryViewModel | undefined;
  updateInitialMessage: (prompt: string, fileName: string | null) => void;
};

export function useAnalysisChatSideEffects({
  canAutoStartInitialQuestion,
  conversationId,
  dispatchInitialQuestionStarted,
  fileName,
  hasAccessToken,
  hasResolvedStartPayload,
  hasStartedInitialQuestion,
  initialPrompt,
  startQuestion,
  summary,
  updateInitialMessage,
}: UseAnalysisChatSideEffectsParams) {
  const startInitialQuestion = useCallback(
    (initialMode: CriteriaInitialMode = 'normal') => {
      if (
        !hasAccessToken ||
        hasStartedInitialQuestion ||
        !hasResolvedStartPayload ||
        !canAutoStartInitialQuestion ||
        conversationId === null
      ) {
        return;
      }

      markAnalysisStartPayloadConsumed(conversationId);
      dispatchInitialQuestionStarted();
      startQuestion(initialPrompt, false, initialMode);
    },
    [
      canAutoStartInitialQuestion,
      conversationId,
      dispatchInitialQuestionStarted,
      hasAccessToken,
      hasResolvedStartPayload,
      hasStartedInitialQuestion,
      initialPrompt,
      startQuestion,
    ],
  );

  useEffect(() => {
    if (!hasResolvedStartPayload) return;

    const timer = window.setTimeout(() => {
      updateInitialMessage(initialPrompt, fileName);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fileName, hasResolvedStartPayload, initialPrompt, updateInitialMessage]);

  useEffect(() => {
    if (
      !hasAccessToken ||
      !summary ||
      hasStartedInitialQuestion ||
      !hasResolvedStartPayload ||
      !canAutoStartInitialQuestion
    ) {
      return;
    }
    if (summary.warnings.length > 0) return;

    const timer = window.setTimeout(() => {
      startInitialQuestion();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [
    canAutoStartInitialQuestion,
    hasAccessToken,
    hasResolvedStartPayload,
    hasStartedInitialQuestion,
    startInitialQuestion,
    summary,
  ]);

  return { startInitialQuestion };
}

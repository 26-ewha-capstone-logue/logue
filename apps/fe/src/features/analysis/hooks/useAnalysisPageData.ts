'use client';

import { useEffect } from 'react';
import { ANALYSIS_WORKFLOW_MESSAGES } from '../config/analysisWorkflowMessages';
import { ANALYSIS_JOB_POLICY } from '../config/analysisWorkflowPolicy';
import type { AnalysisChatFlowActions } from './useAnalysisChatFlow';
import { useAnalysisDataPreview } from './useAnalysisDataPreview';
import { useAnalysisRouteParams } from './useAnalysisRouteParams';
import { useAnalysisStartPayload } from './useAnalysisStartPayload';
import { useSummaryPhase } from './useSummaryPhase';

type UseAnalysisPageDataParams = {
  defaultPrompt: string;
  flowActions: AnalysisChatFlowActions;
  hasAccessToken: boolean;
  routeConversationId: string;
};

export function useAnalysisPageData({
  defaultPrompt,
  flowActions,
  hasAccessToken,
  routeConversationId,
}: UseAnalysisPageDataParams) {
  const { analysisFlowId, conversationId, dataSourceId, routeReady } =
    useAnalysisRouteParams(routeConversationId);
  const { fileName, initialPrompt } = useAnalysisStartPayload({
    conversationId,
    defaultPrompt,
    flowActions,
  });
  const { summary, summaryErrorMessage, summaryPending } = useSummaryPhase({
    analysisFlowId,
    conversationId,
    failedSummaryMessage: ANALYSIS_WORKFLOW_MESSAGES.summary.failed,
    getSummaryErrorMessage: ANALYSIS_WORKFLOW_MESSAGES.summary.getError,
    invalidRouteMessage: ANALYSIS_WORKFLOW_MESSAGES.invalidRoute,
    routeReady: hasAccessToken && routeReady,
    statusPollIntervalMs: ANALYSIS_JOB_POLICY.statusPollIntervalMs,
  });
  useEffect(() => {
    if (!hasAccessToken || !routeReady) return;

    if (summaryPending) {
      flowActions.summaryPending();
      return;
    }

    if (summaryErrorMessage) {
      flowActions.summaryFailed();
      return;
    }

    if (summary) {
      flowActions.summaryReady();
    }
  }, [
    flowActions,
    hasAccessToken,
    routeReady,
    summary,
    summaryErrorMessage,
    summaryPending,
  ]);
  const {
    dataSourceErrorMessage,
    isDataSourceEmpty,
    isDataSourceLoading,
    previewTable,
  } = useAnalysisDataPreview({
    dataSourceId,
    enabled: hasAccessToken,
    errorMessage: ANALYSIS_WORKFLOW_MESSAGES.dataSource.getError,
  });

  return {
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
  };
}

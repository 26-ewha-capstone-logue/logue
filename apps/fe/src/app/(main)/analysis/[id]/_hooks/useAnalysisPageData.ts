'use client';

import type { Dispatch } from 'react';
import { ANALYSIS_WORKFLOW_MESSAGES } from '../_config/analysisWorkflowMessages';
import { ANALYSIS_JOB_POLICY } from '../_config/analysisWorkflowPolicy';
import type { AnalysisChatFlowAction } from './useAnalysisChatFlow';
import { useAnalysisDataPreview } from './useAnalysisDataPreview';
import { useAnalysisRouteParams } from './useAnalysisRouteParams';
import { useAnalysisStartPayload } from './useAnalysisStartPayload';
import { useSummaryPhase } from './useSummaryPhase';

type UseAnalysisPageDataParams = {
  defaultPrompt: string;
  dispatchFlow: Dispatch<AnalysisChatFlowAction>;
  hasAccessToken: boolean;
  routeConversationId: string;
};

export function useAnalysisPageData({
  defaultPrompt,
  dispatchFlow,
  hasAccessToken,
  routeConversationId,
}: UseAnalysisPageDataParams) {
  const { analysisFlowId, conversationId, dataSourceId, routeReady } =
    useAnalysisRouteParams(routeConversationId);
  const { fileName, initialPrompt } = useAnalysisStartPayload({
    conversationId,
    defaultPrompt,
    dispatchFlow,
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
  const {
    dataSourceErrorMessage,
    isDataSourceEmpty,
    isDataSourceLoading,
    previewTable,
  } = useAnalysisDataPreview({
    dataSourceId,
    enabled: hasAccessToken,
    errorMessage: ANALYSIS_WORKFLOW_MESSAGES.dataSource.getError,
    invalidRouteMessage: ANALYSIS_WORKFLOW_MESSAGES.invalidRoute,
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

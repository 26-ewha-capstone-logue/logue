'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { QuestionResultParams } from '@/apis/analysis';
import { getAnalysisErrorMessage } from '../adapters/normalizeAnalysisError';
import { createUpdateCriteriaRequest } from '@/features/analysis/adapters/normalizeCriteria';
import { ANALYSIS_WORKFLOW_MESSAGES } from '../config/analysisWorkflowMessages';
import { ANALYSIS_JOB_POLICY } from '../config/analysisWorkflowPolicy';
import type { CriteriaEditValues } from '@/features/analysis/models/analysisViewModels';
import { getResultCancelKey } from '../utils/analysisCancelTarget';
import { useUpdateCriteriaMutation } from './useCriteriaPhase';
import { useResultPhase } from './useResultPhase';
import type { AnalysisWorkflowEffects } from './useAnalysisWorkflowEffects';
import type { AnalysisWorkflowRoute } from './analysisWorkflowTypes';

type UseCriteriaConfirmationControllerParams = {
  cancellation: {
    consumeCanceledResult: (
      params: Pick<QuestionResultParams, 'analysisCriteriaId' | 'messageId'>,
    ) => boolean;
  };
  dispatch: AnalysisWorkflowEffects['dispatch'];
  messages: AnalysisWorkflowEffects['messages'];
  notify: AnalysisWorkflowEffects['notify'];
  pending: {
    criteriaSubmissionLocked: boolean;
  };
  route: AnalysisWorkflowRoute;
};

export function useCriteriaConfirmationController({
  cancellation,
  dispatch,
  messages,
  notify,
  pending,
  route,
}: UseCriteriaConfirmationControllerParams) {
  const { consumeCanceledResult } = cancellation;
  const { criteriaSubmissionLocked } = pending;
  const { analysisFlowId, conversationId } = route;
  const handledResultKeyRef = useRef<string | null>(null);
  const activeResultSubmissionRef = useRef(false);
  const [pendingResultCancelParams, setPendingResultCancelParams] =
    useState<QuestionResultParams | null>(null);
  const [pendingResultParams, setPendingResultParams] =
    useState<QuestionResultParams | null>(null);
  const updateCriteriaMutation = useUpdateCriteriaMutation();
  const resultAnalysisMutation = useResultPhase({
    enabled: pendingResultParams !== null,
    getResultErrorMessage: ANALYSIS_WORKFLOW_MESSAGES.result.getError,
    params: pendingResultParams,
    resultAnalysisTimeoutMs: ANALYSIS_JOB_POLICY.resultAnalysisTimeoutMs,
    statusPollIntervalMs: ANALYSIS_JOB_POLICY.statusPollIntervalMs,
  });

  const clearPendingResultCancelParams = useCallback(
    (
      params: Pick<QuestionResultParams, 'analysisCriteriaId' | 'messageId'>,
    ) => {
      const canceledKey = getResultCancelKey(params);

      setPendingResultCancelParams((current) =>
        current && getResultCancelKey(current) === canceledKey ? null : current,
      );
      setPendingResultParams((current) =>
        current && getResultCancelKey(current) === canceledKey ? null : current,
      );
      activeResultSubmissionRef.current = false;
    },
    [],
  );

  useEffect(() => {
    if (pendingResultParams === null) return;
    if (resultAnalysisMutation.pending) return;

    const resultKey = getResultCancelKey(pendingResultParams);
    if (handledResultKeyRef.current === resultKey) {
      return;
    }

    handledResultKeyRef.current = resultKey;

    const result = resultAnalysisMutation.result;
    if (result) {
      queueMicrotask(() => {
        clearPendingResultCancelParams(pendingResultParams);
        if (consumeCanceledResult(pendingResultParams)) {
          return;
        }

        dispatch.criteriaSubmissionSucceeded();
        messages.appendResultMessage(result);
      });
      return;
    }

    const error = resultAnalysisMutation.error;
    if (error) {
      queueMicrotask(() => {
        clearPendingResultCancelParams(pendingResultParams);
        if (consumeCanceledResult(pendingResultParams)) {
          return;
        }

        dispatch.criteriaSubmissionFailed();
        notify.showToast(error.message);
        messages.appendNotice(error.message, 'error');
      });
    }
  }, [
    clearPendingResultCancelParams,
    consumeCanceledResult,
    dispatch,
    messages,
    notify,
    pendingResultParams,
    resultAnalysisMutation.error,
    resultAnalysisMutation.pending,
    resultAnalysisMutation.result,
  ]);

  const handleConfirmCriteria = useCallback(
    (messageId: number, values: CriteriaEditValues) => {
      if (
        criteriaSubmissionLocked ||
        activeResultSubmissionRef.current ||
        updateCriteriaMutation.isPending ||
        pendingResultParams !== null ||
        pendingResultCancelParams !== null
      ) {
        return;
      }

      if (conversationId === null || analysisFlowId === null) {
        notify.showToast(ANALYSIS_WORKFLOW_MESSAGES.invalidRoute);
        return;
      }

      handledResultKeyRef.current = null;
      activeResultSubmissionRef.current = true;
      dispatch.criteriaSubmissionStarted();
      setPendingResultCancelParams(null);
      setPendingResultParams(null);

      updateCriteriaMutation.mutate(
        {
          targetConversationId: conversationId,
          targetAnalysisFlowId: analysisFlowId,
          messageId,
          request: createUpdateCriteriaRequest(values),
        },
        {
          onSuccess: ({ analysisCriteriaId }) => {
            messages.appendNotice(
              ANALYSIS_WORKFLOW_MESSAGES.criteria.confirmed,
            );
            const resultParams = {
              conversationId,
              analysisFlowId,
              messageId,
              analysisCriteriaId,
            };
            setPendingResultCancelParams(resultParams);
            setPendingResultParams(resultParams);
          },
          onError: (error) => {
            activeResultSubmissionRef.current = false;
            setPendingResultCancelParams(null);
            setPendingResultParams(null);
            dispatch.criteriaSubmissionFailed();
            const message = getAnalysisErrorMessage(
              error,
              ANALYSIS_WORKFLOW_MESSAGES.criteria.updateError,
            );
            notify.showToast(message);
            messages.appendNotice(message, 'error');
          },
        },
      );
    },
    [
      analysisFlowId,
      conversationId,
      criteriaSubmissionLocked,
      dispatch,
      messages,
      notify,
      pendingResultCancelParams,
      pendingResultParams,
      updateCriteriaMutation,
    ],
  );
  const resultAnalysisActive =
    resultAnalysisMutation.pending && pendingResultCancelParams !== null;

  return {
    clearPendingResultCancelParams,
    handleConfirmCriteria,
    pendingResultCancelParams,
    resultAnalysisActive,
    resultAnalysisPending: resultAnalysisMutation.pending,
    updateCriteriaPending: updateCriteriaMutation.isPending,
  };
}

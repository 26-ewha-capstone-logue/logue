'use client';

import { useCallback, useEffect, useReducer } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  dataSourceKeys,
  getDataSource,
  type FilePreview,
} from '@/apis/datasource';
import { getApiErrorMessage } from '@/apis/errors';
import { useToast } from '@/hooks/useToast';
import { markAnalysisStartPayloadConsumed } from '@/lib/analysisStartPayload';
import type { PromptInputValue } from '../../_components/PromptInput';
import { normalizeAnalysisError } from '../_adapters/normalizeAnalysisError';
import { createUpdateCriteriaRequest } from '../_adapters/normalizeCriteria';
import type { DataTableColumn } from '../_components/DataTablePreview';
import type { CriteriaEditValues } from '../_models/analysisViewModels';
import { uniqueStrings } from '../_utils/stringList';
import {
  useAnalysisChatMessages,
  type CriteriaInitialMode,
} from './useAnalysisChatMessages';
import {
  analysisChatFlowReducer,
  initialAnalysisChatFlowState,
} from './useAnalysisChatFlow';
import { useAnalysisRouteParams } from './useAnalysisRouteParams';
import { useAnalysisStartPayload } from './useAnalysisStartPayload';
import { useCriteriaPhase } from './useCriteriaPhase';
import { useResultPhase } from './useResultPhase';
import { useSummaryPhase } from './useSummaryPhase';

export type {
  ChatMessage,
  CriteriaInitialMode,
} from './useAnalysisChatMessages';

const DEFAULT_PROMPT = 'CSV 파일을 분석해 주세요';
const STATUS_POLL_INTERVAL_MS = 1500;
const QUESTION_ANALYSIS_TIMEOUT_MS = 120000;
const RESULT_ANALYSIS_TIMEOUT_MS = 120000;
const INVALID_ROUTE_MESSAGE = '분석 정보를 찾지 못했어요. 다시 시작해 주세요.';
const SUMMARY_NOT_READY_MESSAGE = 'CSV 데이터 요약이 끝난 뒤 질문할 수 있어요.';
const GET_SUMMARY_ERROR_MESSAGE =
  'CSV 데이터 요약을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
const CREATE_QUESTION_ERROR_MESSAGE =
  '질문 분석을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.';
const GET_CRITERIA_ERROR_MESSAGE =
  '분석 기준을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
const UPDATE_CRITERIA_ERROR_MESSAGE =
  '분석 기준을 확정하지 못했어요. 잠시 후 다시 시도해 주세요.';
const GET_RESULT_ERROR_MESSAGE =
  '최종 분석 결과를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';

const GET_DATA_SOURCE_ERROR_MESSAGE =
  'CSV 미리보기를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';

function getAnalysisErrorMessage(error: unknown, fallbackMessage: string) {
  return normalizeAnalysisError(error, fallbackMessage).message;
}

function createPreviewTable(preview?: FilePreview | null) {
  if (!preview || preview.headers.length === 0) return null;

  const columns: DataTableColumn[] = preview.headers.map((header, index) => ({
    key: `col-${index}`,
    label: header || `컬럼 ${index + 1}`,
  }));
  const rows = preview.rows.map((row) =>
    columns.reduce<Record<string, string>>((acc, column, index) => {
      acc[column.key] = row[index] ?? '';
      return acc;
    }, {}),
  );

  return { columns, rows };
}

type UseAnalysisChatParams = {
  hasAccessToken: boolean;
  routeConversationId: string;
};

export function useAnalysisChat({
  hasAccessToken,
  routeConversationId,
}: UseAnalysisChatParams) {
  const { analysisFlowId, conversationId, dataSourceId, routeReady } =
    useAnalysisRouteParams(routeConversationId);
  const { toast, showToast } = useToast();
  const [flow, dispatchFlow] = useReducer(
    analysisChatFlowReducer,
    initialAnalysisChatFlowState,
  );
  const { fileName, initialPrompt } = useAnalysisStartPayload({
    conversationId,
    defaultPrompt: DEFAULT_PROMPT,
    dispatchFlow,
  });
  const {
    appendCriteriaMessage,
    appendNotice,
    appendResultMessage,
    appendUserQuestion,
    initialMessage,
    restMessages,
    updateInitialMessage,
  } = useAnalysisChatMessages(DEFAULT_PROMPT);
  const {
    canAutoStartInitialQuestion,
    criteriaSubmissionLocked,
    hasResolvedStartPayload,
    hasStartedInitialQuestion,
    questionSubmissionLocked,
  } = flow;

  const dataSourceQuery = useQuery({
    queryKey: dataSourceKeys.detail(dataSourceId ?? 0),
    queryFn: () => {
      if (dataSourceId === null) throw new Error(INVALID_ROUTE_MESSAGE);
      return getDataSource(dataSourceId);
    },
    enabled: hasAccessToken && dataSourceId !== null,
  });

  const { summary, summaryErrorMessage, summaryPending } = useSummaryPhase({
    analysisFlowId,
    conversationId,
    failedSummaryMessage:
      'CSV 데이터 요약에 실패했어요. 파일을 확인하고 다시 시도해 주세요.',
    getSummaryErrorMessage: GET_SUMMARY_ERROR_MESSAGE,
    invalidRouteMessage: INVALID_ROUTE_MESSAGE,
    routeReady: hasAccessToken && routeReady,
    statusPollIntervalMs: STATUS_POLL_INTERVAL_MS,
  });
  const dataSourcePreview = hasAccessToken
    ? dataSourceQuery.data?.preview
    : undefined;
  const previewTable = createPreviewTable(dataSourcePreview);
  const dataSourceErrorMessage = dataSourceQuery.isError
    ? getApiErrorMessage(dataSourceQuery.error, GET_DATA_SOURCE_ERROR_MESSAGE)
    : null;
  const isDataSourceEmpty =
    hasAccessToken && dataSourceQuery.isSuccess && !previewTable;
  const { questionAnalysisMutation, updateCriteriaMutation } = useCriteriaPhase(
    {
      getCriteriaErrorMessage: GET_CRITERIA_ERROR_MESSAGE,
      questionAnalysisTimeoutMs: QUESTION_ANALYSIS_TIMEOUT_MS,
      statusPollIntervalMs: STATUS_POLL_INTERVAL_MS,
    },
  );
  const {
    mutate: mutateQuestionAnalysis,
    isPending: isQuestionAnalysisPending,
  } = questionAnalysisMutation;
  const resultAnalysisMutation = useResultPhase({
    getResultErrorMessage: GET_RESULT_ERROR_MESSAGE,
    resultAnalysisTimeoutMs: RESULT_ANALYSIS_TIMEOUT_MS,
    statusPollIntervalMs: STATUS_POLL_INTERVAL_MS,
  });

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

      dispatchFlow({ type: 'question-submission-started' });

      if (appendUserMessage) {
        appendUserQuestion(normalizedQuestion);
      }

      mutateQuestionAnalysis(
        {
          targetConversationId: conversationId,
          targetAnalysisFlowId: analysisFlowId,
          question: normalizedQuestion,
          initialMode,
        },
        {
          onSuccess: (criteria, variables) => {
            dispatchFlow({ type: 'question-submission-finished' });
            appendCriteriaMessage(criteria, variables.initialMode);
          },
          onError: (error) => {
            dispatchFlow({ type: 'question-submission-finished' });
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
      conversationId,
      dispatchFlow,
      mutateQuestionAnalysis,
      questionSubmissionLocked,
      showToast,
    ],
  );

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
      dispatchFlow({ type: 'initial-question-started' });
      startQuestion(initialPrompt, false, initialMode);
    },
    [
      canAutoStartInitialQuestion,
      conversationId,
      hasAccessToken,
      hasResolvedStartPayload,
      hasStartedInitialQuestion,
      initialPrompt,
      dispatchFlow,
      startQuestion,
    ],
  );

  const handleSubmit = useCallback(
    (value: PromptInputValue) => {
      if (!summary) {
        showToast(SUMMARY_NOT_READY_MESSAGE);
        return;
      }

      if (conversationId !== null) {
        markAnalysisStartPayloadConsumed(conversationId);
      }
      dispatchFlow({ type: 'initial-question-started' });
      startQuestion(value.prompt);
    },
    [conversationId, dispatchFlow, showToast, startQuestion, summary],
  );

  function handleConfirmCriteria(
    messageId: number,
    values: CriteriaEditValues,
  ) {
    if (criteriaSubmissionLocked) return;

    if (conversationId === null || analysisFlowId === null) {
      showToast(INVALID_ROUTE_MESSAGE);
      return;
    }

    dispatchFlow({ type: 'criteria-submission-started' });

    updateCriteriaMutation.mutate(
      {
        targetConversationId: conversationId,
        targetAnalysisFlowId: analysisFlowId,
        messageId,
        request: createUpdateCriteriaRequest(values),
      },
      {
        onSuccess: ({ analysisCriteriaId }) => {
          appendNotice('분석 기준이 확정되었어요.');
          resultAnalysisMutation.mutate(
            {
              targetConversationId: conversationId,
              targetAnalysisFlowId: analysisFlowId,
              messageId,
              analysisCriteriaId,
            },
            {
              onSuccess: (result) => {
                dispatchFlow({ type: 'criteria-submission-finished' });
                appendResultMessage(result);
              },
              onError: (error) => {
                dispatchFlow({ type: 'criteria-submission-finished' });
                const message = getAnalysisErrorMessage(
                  error,
                  GET_RESULT_ERROR_MESSAGE,
                );
                showToast(message);
                appendNotice(message, 'error');
              },
            },
          );
        },
        onError: (error) => {
          dispatchFlow({ type: 'criteria-submission-finished' });
          const message = getAnalysisErrorMessage(
            error,
            UPDATE_CRITERIA_ERROR_MESSAGE,
          );
          showToast(message);
          appendNotice(message, 'error');
        },
      },
    );
  }

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

  const summaryColumnOptions = summary?.columnOptions ?? [];
  const summarySortOptions = uniqueStrings([
    ...(summary?.measureOptions ?? []),
    ...summaryColumnOptions,
  ]);
  const shouldShowAnalyzing =
    summaryPending ||
    isQuestionAnalysisPending ||
    updateCriteriaMutation.isPending ||
    resultAnalysisMutation.isPending;
  const analyzingMessage = summaryPending
    ? 'CSV 데이터를 분석 중이에요'
    : updateCriteriaMutation.isPending
      ? '분석 기준을 확정 중이에요'
      : resultAnalysisMutation.isPending
        ? '최종 분석 결과를 생성 중이에요'
        : '질문을 분석 중이에요';
  const inputDisabled =
    !summary ||
    isQuestionAnalysisPending ||
    updateCriteriaMutation.isPending ||
    resultAnalysisMutation.isPending;
  const summaryWarnings = summary?.warnings ?? [];
  const summaryActionDisabled =
    hasStartedInitialQuestion ||
    !hasResolvedStartPayload ||
    !canAutoStartInitialQuestion ||
    isQuestionAnalysisPending ||
    updateCriteriaMutation.isPending;
  const criteriaSubmitting =
    criteriaSubmissionLocked ||
    updateCriteriaMutation.isPending ||
    resultAnalysisMutation.isPending;
  return {
    analyzingMessage,
    criteriaSubmitting,
    handleConfirmCriteria,
    handleSubmit,
    initialMessage,
    inputDisabled,
    dataSourceErrorMessage,
    isDataSourceLoading: hasAccessToken && dataSourceQuery.isLoading,
    isDataSourceEmpty,
    previewTable,
    restMessages,
    shouldShowAnalyzing,
    startInitialQuestion,
    summary,
    summaryActionDisabled,
    summaryColumnOptions,
    summaryErrorMessage,
    summarySortOptions,
    summaryWarnings,
    toast,
  };
}

export type UseAnalysisChatResult = ReturnType<typeof useAnalysisChat>;

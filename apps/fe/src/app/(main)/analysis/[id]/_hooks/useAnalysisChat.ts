'use client';

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import {
  dataSourceKeys,
  getDataSource,
  type FilePreview,
} from '@/apis/datasource';
import { getApiErrorMessage } from '@/apis/errors';
import { useToast } from '@/hooks/useToast';
import {
  hasAnalysisStartPayloadConsumed,
  markAnalysisStartPayloadConsumed,
  readAnalysisStartPayload,
  type AnalysisStartPayload,
} from '@/lib/analysisStartPayload';
import type { PromptInputValue } from '../../_components/PromptInput';
import { createUpdateCriteriaRequest } from '../_adapters/normalizeCriteria';
import type { DataTableColumn } from '../_components/DataTablePreview';
import type {
  CriteriaEditValues,
  CriteriaViewModel,
  QuestionResultViewModel,
} from '../_models/analysisViewModels';
import { uniqueStrings } from '../_utils/stringList';
import {
  analysisChatFlowReducer,
  initialAnalysisChatFlowState,
} from './useAnalysisChatFlow';
import { useCriteriaPhase } from './useCriteriaPhase';
import { useResultPhase } from './useResultPhase';
import { useSummaryPhase } from './useSummaryPhase';

export type CriteriaInitialMode = 'normal' | 'edit';

export type ChatMessage =
  | {
      id: string;
      role: 'user';
      content: string;
      fileName?: string | null;
    }
  | {
      id: string;
      role: 'bot';
      kind: 'criteria';
      criteria: CriteriaViewModel;
      initialMode?: CriteriaInitialMode;
    }
  | {
      id: string;
      role: 'bot';
      kind: 'verification';
      result: QuestionResultViewModel;
    }
  | {
      id: string;
      role: 'bot';
      kind: 'notice';
      content: string;
      tone?: 'default' | 'error';
    };

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

function parsePositiveNumber(value: string | null | undefined) {
  if (!value) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
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

function createMessageId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

type UseAnalysisChatParams = {
  hasAccessToken: boolean;
  routeConversationId: string;
};

export function useAnalysisChat({
  hasAccessToken,
  routeConversationId,
}: UseAnalysisChatParams) {
  const searchParams = useSearchParams();
  const conversationId = parsePositiveNumber(routeConversationId);
  const analysisFlowId = parsePositiveNumber(
    searchParams.get('analysisFlowId'),
  );
  const dataSourceId = parsePositiveNumber(searchParams.get('dataSourceId'));
  const routeReady = conversationId !== null && analysisFlowId !== null;

  const [startPayload, setStartPayload] = useState<AnalysisStartPayload>(
    () => ({
      prompt: DEFAULT_PROMPT,
      fileName: null,
    }),
  );
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'init-user',
      role: 'user',
      content: DEFAULT_PROMPT,
      fileName: null,
    },
  ]);
  const { toast, showToast } = useToast();
  const [flow, dispatchFlow] = useReducer(
    analysisChatFlowReducer,
    initialAnalysisChatFlowState,
  );
  const readStartPayloadConversationIdRef = useRef<number | null>(null);
  const {
    canAutoStartInitialQuestion,
    criteriaSubmissionLocked,
    hasResolvedStartPayload,
    hasStartedInitialQuestion,
    questionSubmissionLocked,
  } = flow;

  const initialPrompt = startPayload.prompt || DEFAULT_PROMPT;
  const fileName = startPayload.fileName ?? null;

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

  const appendNotice = useCallback(
    (content: string, tone: 'default' | 'error' = 'default') => {
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId('notice'),
          role: 'bot',
          kind: 'notice',
          content,
          tone,
        },
      ]);
    },
    [setMessages],
  );

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
        setMessages((prev) => [
          ...prev,
          {
            id: createMessageId('user'),
            role: 'user',
            content: normalizedQuestion,
          },
        ]);
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
            setMessages((prev) => [
              ...prev,
              {
                id: `criteria-${criteria.messageId}`,
                role: 'bot',
                kind: 'criteria',
                criteria,
                initialMode: variables.initialMode,
              },
            ]);
          },
          onError: (error) => {
            dispatchFlow({ type: 'question-submission-finished' });
            const message = getApiErrorMessage(
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
      appendNotice,
      conversationId,
      dispatchFlow,
      mutateQuestionAnalysis,
      questionSubmissionLocked,
      setMessages,
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
                setMessages((prev) => [
                  ...prev,
                  {
                    id:
                      result.resultId === null
                        ? createMessageId('result')
                        : `result-${result.resultId}`,
                    role: 'bot',
                    kind: 'verification',
                    result,
                  },
                ]);
              },
              onError: (error) => {
                dispatchFlow({ type: 'criteria-submission-finished' });
                const message = getApiErrorMessage(
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
          const message = getApiErrorMessage(
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
    if (
      conversationId !== null &&
      readStartPayloadConversationIdRef.current === conversationId
    ) {
      return;
    }

    dispatchFlow({ type: 'start-payload-loading' });

    const timer = window.setTimeout(() => {
      if (conversationId === null) {
        setStartPayload({ prompt: DEFAULT_PROMPT, fileName: null });
        dispatchFlow({
          type: 'start-payload-resolved',
          canAutoStartInitialQuestion: false,
        });
        return;
      }

      readStartPayloadConversationIdRef.current = conversationId;

      const storedPayload = readAnalysisStartPayload(conversationId);
      const canAutoStart =
        storedPayload !== null &&
        !hasAnalysisStartPayloadConsumed(conversationId);

      setStartPayload({
        prompt: storedPayload?.prompt || DEFAULT_PROMPT,
        fileName: storedPayload?.fileName ?? null,
      });
      dispatchFlow({
        type: 'start-payload-resolved',
        canAutoStartInitialQuestion: canAutoStart,
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [conversationId]);

  useEffect(() => {
    if (!hasResolvedStartPayload) return;

    const timer = window.setTimeout(() => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === 'init-user' && message.role === 'user'
            ? {
                ...message,
                content: initialPrompt,
                fileName,
              }
            : message,
        ),
      );
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fileName, hasResolvedStartPayload, initialPrompt]);

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
  const [initialMessage, ...restMessages] = messages;

  return {
    analyzingMessage,
    criteriaSubmitting,
    handleConfirmCriteria,
    handleSubmit,
    initialMessage,
    inputDisabled,
    isDataSourceLoading: hasAccessToken && dataSourceQuery.isLoading,
    previewTable: createPreviewTable(dataSourcePreview),
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

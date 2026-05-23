'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import {
  analysisQueryKeys,
  createQuestion,
  getCriteria,
  getCriteriaStatus,
  getResult,
  getResultStatus,
  getSummary,
  getSummaryStatus,
  updateCriteria,
  type AnalysisJobStatus,
  type GetQuestionCriteriaResponse,
  type GetQuestionResultResponse,
  type GetSummaryResponse,
  type QuestionCriteriaParams,
  type QuestionResultParams,
  type UpdateQuestionCriteriaRequest,
} from '@/apis/analysis';
import {
  dataSourceQueryKeys,
  getDataSource,
  type FilePreview,
} from '@/apis/dataSource';
import { getApiErrorMessage } from '@/apis/errors';
import { ChatBubble, ToastAlert } from '@/components';
import {
  readAnalysisStartPayload,
  type AnalysisStartPayload,
} from '@/lib/analysisStartPayload';
import PromptInput, { type PromptInputValue } from '../_components/PromptInput';
import AnalysisResult, {
  type ColumnCandidate,
} from './_components/AnalysisResult';
import AnalyzingIndicator from './_components/AnalyzingIndicator';
import DataTablePreview, {
  type DataTableColumn,
} from './_components/DataTablePreview';
import LoadingDataPreview from './_components/LoadingDataPreview';
import QuestionAnalysisResult from './_components/QuestionAnalysisResult';
import ResizableSplit from './_components/ResizableSplit';
import VerificationResult from './_components/VerificationResult';

type PageParams = { id: string };
type CriteriaInitialMode = 'normal' | 'edit';

type ChatMessage =
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
      criteria: GetQuestionCriteriaResponse;
      initialMode?: CriteriaInitialMode;
    }
  | {
      id: string;
      role: 'bot';
      kind: 'verification';
      result: GetQuestionResultResponse;
    }
  | {
      id: string;
      role: 'bot';
      kind: 'notice';
      content: string;
      tone?: 'default' | 'error';
    };

const DEFAULT_PROMPT = 'CSV 파일을 분석해주세요';
const STATUS_POLL_INTERVAL_MS = 1500;
const QUESTION_ANALYSIS_TIMEOUT_MS = 120000;
const RESULT_ANALYSIS_TIMEOUT_MS = 120000;
const TOAST_DURATION_MS = 2500;
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

const SUMMARY_WARNING_MESSAGE_MAP: Record<string, string> = {
  date_field_conflict:
    '날짜 기준을 하나로 정할 수 없어요. 어떤 날짜를 기준으로 볼지 선택해 주세요.',
};

type QuestionAnalysisVariables = {
  targetConversationId: number;
  targetAnalysisFlowId: number;
  question: string;
};

type UpdateCriteriaVariables = {
  targetConversationId: number;
  targetAnalysisFlowId: number;
  messageId: number;
  request: UpdateQuestionCriteriaRequest;
};

type ResultAnalysisVariables = {
  targetConversationId: number;
  targetAnalysisFlowId: number;
  messageId: number;
  analysisCriteriaId: number;
};

function parsePositiveNumber(value: string | null | undefined) {
  if (!value) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function compactStrings(values: Array<string | null | undefined>) {
  return values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(compactStrings(values)));
}

function shouldPollJobStatus(status?: AnalysisJobStatus) {
  return (
    !status ||
    status === 'QUEUED' ||
    status === 'RUNNING' ||
    status === 'RETRYING'
  );
}

function isFailedJobStatus(status?: AnalysisJobStatus) {
  return status === 'FAILED' || status === 'CANCELED' || status === 'CANCELLED';
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForCriteriaSuccess(params: QuestionCriteriaParams) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < QUESTION_ANALYSIS_TIMEOUT_MS) {
    const { status } = await getCriteriaStatus(params);

    if (status === 'SUCCESS') return;
    if (isFailedJobStatus(status)) {
      throw new Error(GET_CRITERIA_ERROR_MESSAGE);
    }

    await wait(STATUS_POLL_INTERVAL_MS);
  }

  throw new Error(GET_CRITERIA_ERROR_MESSAGE);
}

async function waitForResultSuccess(params: QuestionResultParams) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < RESULT_ANALYSIS_TIMEOUT_MS) {
    const { status } = await getResultStatus(params);

    if (status === 'SUCCESS') return;
    if (isFailedJobStatus(status)) {
      throw new Error(GET_RESULT_ERROR_MESSAGE);
    }

    await wait(STATUS_POLL_INTERVAL_MS);
  }

  throw new Error(GET_RESULT_ERROR_MESSAGE);
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

function createSummaryCandidates(summary: GetSummaryResponse) {
  const groups = [
    { name: '데이터 기준', values: summary.dataCriteria },
    { name: '지표', values: summary.measure },
    { name: '차원', values: summary.dimension },
    { name: '상태 조건', values: summary.statusCondition },
    { name: '플래그', values: summary.flag },
    { name: '식별 기준', values: summary.idCriteria },
  ];

  return groups.flatMap<ColumnCandidate>((group) =>
    group.values.map((value) => ({
      name: group.name,
      example: value,
    })),
  );
}

function mapSummaryWarning(value: string) {
  const normalized = value.trim();
  return SUMMARY_WARNING_MESSAGE_MAP[normalized] ?? normalized;
}

function createSummaryWarnings(summary?: GetSummaryResponse) {
  const warning = summary?.sourceDataWarning?.trim();
  if (!warning) return [];

  return warning.split('\n').map(mapSummaryWarning).filter(Boolean);
}

function getSummaryColumnOptions(summary?: GetSummaryResponse) {
  if (!summary) return [];

  return uniqueStrings([
    ...summary.dataCriteria,
    ...summary.measure,
    ...summary.dimension,
    ...summary.statusCondition,
    ...summary.flag,
    ...summary.idCriteria,
  ]);
}

function createMessageId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function AnalysisChatPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const conversationId = parsePositiveNumber(id);
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [hasStartedInitialQuestion, setHasStartedInitialQuestion] =
    useState(false);
  const [hasResolvedStartPayload, setHasResolvedStartPayload] = useState(false);
  const openNextCriteriaInEditRef = useRef(false);
  const readStartPayloadConversationIdRef = useRef<number | null>(null);
  const questionSubmissionLockedRef = useRef(false);
  const criteriaSubmissionLockedRef = useRef(false);

  const initialPrompt = startPayload.prompt || DEFAULT_PROMPT;
  const fileName = startPayload.fileName ?? null;

  const dataSourceQuery = useQuery({
    queryKey: dataSourceQueryKeys.detail(dataSourceId ?? 0),
    queryFn: () => {
      if (dataSourceId === null) throw new Error(INVALID_ROUTE_MESSAGE);
      return getDataSource(dataSourceId);
    },
    enabled: dataSourceId !== null,
  });

  const summaryStatusQuery = useQuery({
    queryKey: analysisQueryKeys.summaryStatus(
      conversationId ?? 0,
      analysisFlowId ?? 0,
    ),
    queryFn: () => {
      if (conversationId === null || analysisFlowId === null) {
        throw new Error(INVALID_ROUTE_MESSAGE);
      }

      return getSummaryStatus({ conversationId, analysisFlowId });
    },
    enabled: routeReady,
    refetchInterval: (query) => {
      const status = query.state.data?.status;

      if (query.state.error || !status) return false;

      return shouldPollJobStatus(status) ? STATUS_POLL_INTERVAL_MS : false;
    },
  });
  const summaryStatus = summaryStatusQuery.data?.status;

  const summaryQuery = useQuery({
    queryKey: analysisQueryKeys.summary(
      conversationId ?? 0,
      analysisFlowId ?? 0,
    ),
    queryFn: () => {
      if (conversationId === null || analysisFlowId === null) {
        throw new Error(INVALID_ROUTE_MESSAGE);
      }

      return getSummary({ conversationId, analysisFlowId });
    },
    enabled: routeReady && summaryStatus === 'SUCCESS',
  });

  const {
    mutate: mutateQuestionAnalysis,
    isPending: isQuestionAnalysisPending,
  } = useMutation({
    mutationFn: async ({
      targetConversationId,
      targetAnalysisFlowId,
      question,
    }: QuestionAnalysisVariables) => {
      const createdQuestion = await createQuestion(
        {
          conversationId: targetConversationId,
          analysisFlowId: targetAnalysisFlowId,
        },
        { question },
      );
      const criteriaParams = {
        conversationId: targetConversationId,
        analysisFlowId: targetAnalysisFlowId,
        messageId: createdQuestion.messageId,
      };

      await waitForCriteriaSuccess(criteriaParams);
      return getCriteria(criteriaParams);
    },
  });

  const updateCriteriaMutation = useMutation({
    mutationFn: ({
      targetConversationId,
      targetAnalysisFlowId,
      messageId,
      request,
    }: UpdateCriteriaVariables) =>
      updateCriteria(
        {
          conversationId: targetConversationId,
          analysisFlowId: targetAnalysisFlowId,
          messageId,
        },
        request,
      ),
  });

  const resultAnalysisMutation = useMutation({
    mutationFn: async ({
      targetConversationId,
      targetAnalysisFlowId,
      messageId,
      analysisCriteriaId,
    }: ResultAnalysisVariables) => {
      const resultParams = {
        conversationId: targetConversationId,
        analysisFlowId: targetAnalysisFlowId,
        messageId,
        analysisCriteriaId,
      };

      await waitForResultSuccess(resultParams);
      return getResult(resultParams);
    },
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
    (question: string, appendUserMessage = true) => {
      if (questionSubmissionLockedRef.current) return;

      if (conversationId === null || analysisFlowId === null) {
        setToastMessage(INVALID_ROUTE_MESSAGE);
        appendNotice(INVALID_ROUTE_MESSAGE, 'error');
        return;
      }

      const normalizedQuestion = question.trim();
      if (!normalizedQuestion) return;

      questionSubmissionLockedRef.current = true;

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
        },
        {
          onSuccess: (criteria) => {
            questionSubmissionLockedRef.current = false;
            const initialMode: CriteriaInitialMode =
              openNextCriteriaInEditRef.current ? 'edit' : 'normal';
            openNextCriteriaInEditRef.current = false;
            setMessages((prev) => [
              ...prev,
              {
                id: `criteria-${criteria.messageId}`,
                role: 'bot',
                kind: 'criteria',
                criteria,
                initialMode,
              },
            ]);
          },
          onError: (error) => {
            questionSubmissionLockedRef.current = false;
            openNextCriteriaInEditRef.current = false;
            const message = getApiErrorMessage(
              error,
              CREATE_QUESTION_ERROR_MESSAGE,
            );
            setToastMessage(message);
            appendNotice(message, 'error');
          },
        },
      );
    },
    [
      analysisFlowId,
      appendNotice,
      conversationId,
      mutateQuestionAnalysis,
      setMessages,
      setToastMessage,
    ],
  );

  const startInitialQuestion = useCallback(
    (initialMode: CriteriaInitialMode = 'normal') => {
      if (hasStartedInitialQuestion || !hasResolvedStartPayload) return;

      setHasStartedInitialQuestion(true);
      openNextCriteriaInEditRef.current = initialMode === 'edit';
      startQuestion(initialPrompt, false);
    },
    [
      hasResolvedStartPayload,
      hasStartedInitialQuestion,
      initialPrompt,
      setHasStartedInitialQuestion,
      startQuestion,
    ],
  );

  function handleSubmit(value: PromptInputValue) {
    if (!summaryQuery.data) {
      setToastMessage(SUMMARY_NOT_READY_MESSAGE);
      return;
    }

    setHasStartedInitialQuestion(true);
    openNextCriteriaInEditRef.current = false;
    startQuestion(value.prompt);
  }

  function handleConfirmCriteria(
    messageId: number,
    request: UpdateQuestionCriteriaRequest,
  ) {
    if (criteriaSubmissionLockedRef.current) return;

    if (conversationId === null || analysisFlowId === null) {
      setToastMessage(INVALID_ROUTE_MESSAGE);
      return;
    }

    criteriaSubmissionLockedRef.current = true;

    updateCriteriaMutation.mutate(
      {
        targetConversationId: conversationId,
        targetAnalysisFlowId: analysisFlowId,
        messageId,
        request,
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
                criteriaSubmissionLockedRef.current = false;
                setMessages((prev) => [
                  ...prev,
                  {
                    id: `result-${result.resultId}`,
                    role: 'bot',
                    kind: 'verification',
                    result,
                  },
                ]);
              },
              onError: (error) => {
                criteriaSubmissionLockedRef.current = false;
                const message = getApiErrorMessage(
                  error,
                  GET_RESULT_ERROR_MESSAGE,
                );
                setToastMessage(message);
                appendNotice(message, 'error');
              },
            },
          );
        },
        onError: (error) => {
          criteriaSubmissionLockedRef.current = false;
          const message = getApiErrorMessage(
            error,
            UPDATE_CRITERIA_ERROR_MESSAGE,
          );
          setToastMessage(message);
          appendNotice(message, 'error');
        },
      },
    );
  }

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(
      () => setToastMessage(null),
      TOAST_DURATION_MS,
    );
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    if (
      conversationId !== null &&
      readStartPayloadConversationIdRef.current === conversationId
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (conversationId === null) {
        setStartPayload({ prompt: DEFAULT_PROMPT, fileName: null });
        setHasResolvedStartPayload(true);
        return;
      }

      readStartPayloadConversationIdRef.current = conversationId;

      const storedPayload = readAnalysisStartPayload(conversationId);

      setStartPayload({
        prompt: storedPayload?.prompt || DEFAULT_PROMPT,
        fileName: storedPayload?.fileName ?? null,
      });
      setHasResolvedStartPayload(true);
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
      !summaryQuery.data ||
      hasStartedInitialQuestion ||
      !hasResolvedStartPayload
    ) {
      return;
    }
    if (createSummaryWarnings(summaryQuery.data).length > 0) return;

    const timer = window.setTimeout(() => {
      startInitialQuestion();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [
    hasResolvedStartPayload,
    hasStartedInitialQuestion,
    startInitialQuestion,
    summaryQuery.data,
  ]);

  const previewTable = createPreviewTable(dataSourceQuery.data?.preview);
  const summaryColumnOptions = getSummaryColumnOptions(summaryQuery.data);
  const summaryPending =
    routeReady &&
    !summaryStatusQuery.isError &&
    !summaryQuery.isError &&
    !summaryQuery.data &&
    !isFailedJobStatus(summaryStatus);
  const summaryErrorMessage = !routeReady
    ? INVALID_ROUTE_MESSAGE
    : summaryStatusQuery.isError
      ? getApiErrorMessage(summaryStatusQuery.error, GET_SUMMARY_ERROR_MESSAGE)
      : summaryQuery.isError
        ? getApiErrorMessage(summaryQuery.error, GET_SUMMARY_ERROR_MESSAGE)
        : isFailedJobStatus(summaryStatus)
          ? 'CSV 데이터 요약에 실패했어요. 파일을 확인한 뒤 다시 시도해 주세요.'
          : null;
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
    !summaryQuery.data ||
    isQuestionAnalysisPending ||
    updateCriteriaMutation.isPending ||
    resultAnalysisMutation.isPending;

  const renderSummaryMessage = () => {
    if (!summaryQuery.data) return null;

    const warnings = createSummaryWarnings(summaryQuery.data);
    const hasWarnings = warnings.length > 0;
    const summaryActionDisabled =
      hasStartedInitialQuestion ||
      !hasResolvedStartPayload ||
      isQuestionAnalysisPending ||
      updateCriteriaMutation.isPending;

    return (
      <div key="summary" className="flex w-full justify-start">
        <div className="w-full max-w-[80%]">
          <AnalysisResult
            rowCount={summaryQuery.data.rowCount}
            columnCount={summaryQuery.data.columnCount}
            candidates={createSummaryCandidates(summaryQuery.data)}
            warnings={warnings}
            warningActions={
              hasWarnings
                ? {
                    disabled: summaryActionDisabled,
                    onEdit: () => startInitialQuestion('edit'),
                    onContinue: () => startInitialQuestion(),
                  }
                : undefined
            }
          />
        </div>
      </div>
    );
  };

  const renderErrorMessage = () => {
    if (!summaryErrorMessage) return null;

    return (
      <ChatBubble key="summary-error" role="bot">
        <p className="text-error-500">{summaryErrorMessage}</p>
      </ChatBubble>
    );
  };

  const renderMessage = (message: ChatMessage) => {
    if (message.role === 'user') {
      return (
        <ChatBubble
          key={message.id}
          role="user"
          file={
            message.fileName
              ? { name: message.fileName, status: 'uploaded' }
              : undefined
          }
        >
          {message.content}
        </ChatBubble>
      );
    }

    if (message.kind === 'notice') {
      return (
        <ChatBubble key={message.id} role="bot">
          <p
            className={
              message.tone === 'error' ? 'text-error-500' : 'text-gray-900'
            }
          >
            {message.content}
          </p>
        </ChatBubble>
      );
    }

    if (message.kind === 'verification') {
      return (
        <div key={message.id} className="flex w-full justify-start">
          <div className="w-full max-w-[80%]">
            <VerificationResult result={message.result} />
          </div>
        </div>
      );
    }

    return (
      <div key={message.id} className="flex w-full justify-start">
        <div className="w-full max-w-[80%]">
          <QuestionAnalysisResult
            criteria={message.criteria.criteria}
            initialMode={message.initialMode}
            baseDateColumnOptions={
              summaryQuery.data?.dataCriteria.length
                ? summaryQuery.data.dataCriteria
                : summaryColumnOptions
            }
            groupByOptions={summaryColumnOptions}
            sortByOptions={uniqueStrings([
              ...(summaryQuery.data?.measure ?? []),
              ...summaryColumnOptions,
            ])}
            isSubmitting={
              updateCriteriaMutation.isPending ||
              resultAnalysisMutation.isPending
            }
            onContinue={(values) =>
              handleConfirmCriteria(message.criteria.messageId, values)
            }
          />
        </div>
      </div>
    );
  };

  const [initialMessage, ...restMessages] = messages;

  return (
    <ResizableSplit
      rightCollapsed={isChatCollapsed}
      onRightCollapsedChange={setIsChatCollapsed}
      left={
        previewTable ? (
          <DataTablePreview
            columns={previewTable.columns}
            rows={previewTable.rows}
          />
        ) : dataSourceQuery.isLoading ? (
          <LoadingDataPreview message="CSV 미리보기를 불러오는 중이에요" />
        ) : (
          <LoadingDataPreview />
        )
      }
      right={
        <div className="flex h-full min-h-0 flex-col">
          <div className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-24 overflow-y-auto px-24 pt-32 pb-24">
            {initialMessage ? renderMessage(initialMessage) : null}
            {renderSummaryMessage()}
            {renderErrorMessage()}
            {restMessages.map(renderMessage)}
            {shouldShowAnalyzing && (
              <div className="flex w-full justify-start">
                <div className="w-full max-w-[80%]">
                  <AnalyzingIndicator message={analyzingMessage} />
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0 px-24 pt-12 pb-24">
            <PromptInput
              showFileAttach={false}
              submitDisabled={inputDisabled}
              onSubmit={handleSubmit}
            />
          </div>

          {toastMessage && (
            <div className="pointer-events-none fixed bottom-[4.4rem] left-1/2 z-[60] -translate-x-1/2">
              <ToastAlert role="alert">{toastMessage}</ToastAlert>
            </div>
          )}
        </div>
      }
    />
  );
}

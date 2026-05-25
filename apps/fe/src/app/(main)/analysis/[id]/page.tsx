'use client';

import { use, useState } from 'react';
import { ChatBubble, ToastAlert } from '@/components';
import PromptInput from '../_components/PromptInput';
import AnalysisResult from './_components/AnalysisResult';
import AnalyzingIndicator from './_components/AnalyzingIndicator';
import DataTablePreview from './_components/DataTablePreview';
import LoadingDataPreview from './_components/LoadingDataPreview';
import QuestionAnalysisResult from './_components/QuestionAnalysisResult';
import ResizableSplit from './_components/ResizableSplit';
import VerificationResult from './_components/VerificationResult';
import {
  createSummaryCandidates,
  uniqueStrings,
  useAnalysisChat,
  type ChatMessage,
} from './_hooks/useAnalysisChat';

type PageParams = { id: string };

export default function AnalysisChatPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { id } = use(params);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const chat = useAnalysisChat(id);

  const renderSummaryMessage = () => {
    if (!chat.summary) return null;

    const hasWarnings = chat.summaryWarnings.length > 0;

    return (
      <div key="summary" className="flex w-full justify-start">
        <div className="w-full max-w-[80%]">
          <AnalysisResult
            rowCount={chat.summary.rowCount}
            columnCount={chat.summary.columnCount}
            candidates={createSummaryCandidates(chat.summary)}
            warnings={chat.summaryWarnings}
            warningActions={
              hasWarnings
                ? {
                    disabled: chat.summaryActionDisabled,
                    onEdit: () => chat.startInitialQuestion('edit'),
                    onContinue: () => chat.startInitialQuestion(),
                  }
                : undefined
            }
          />
        </div>
      </div>
    );
  };

  const renderErrorMessage = () => {
    if (!chat.summaryErrorMessage) return null;

    return (
      <ChatBubble key="summary-error" role="bot">
        <p className="text-error-500">{chat.summaryErrorMessage}</p>
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
              chat.summary?.dataCriteria.length
                ? chat.summary.dataCriteria
                : chat.summaryColumnOptions
            }
            groupByOptions={chat.summaryColumnOptions}
            sortByOptions={uniqueStrings([
              ...(chat.summary?.measure ?? []),
              ...chat.summaryColumnOptions,
            ])}
            isSubmitting={chat.criteriaSubmitting}
            onContinue={(values) =>
              chat.handleConfirmCriteria(message.criteria.messageId, values)
            }
          />
        </div>
      </div>
    );
  };

  return (
    <ResizableSplit
      rightCollapsed={isChatCollapsed}
      onRightCollapsedChange={setIsChatCollapsed}
      left={
        chat.previewTable ? (
          <DataTablePreview
            columns={chat.previewTable.columns}
            rows={chat.previewTable.rows}
          />
        ) : chat.isDataSourceLoading ? (
          <LoadingDataPreview message="CSV 미리보기를 불러오는 중이에요" />
        ) : (
          <LoadingDataPreview />
        )
      }
      right={
        <div className="flex h-full min-h-0 flex-col">
          <div className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-24 overflow-y-auto px-24 pt-32 pb-24">
            {chat.initialMessage ? renderMessage(chat.initialMessage) : null}
            {renderSummaryMessage()}
            {renderErrorMessage()}
            {chat.restMessages.map(renderMessage)}
            {chat.shouldShowAnalyzing && (
              <div className="flex w-full justify-start">
                <div className="w-full max-w-[80%]">
                  <AnalyzingIndicator message={chat.analyzingMessage} />
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0 px-24 pt-12 pb-24">
            <PromptInput
              showFileAttach={false}
              submitDisabled={chat.inputDisabled}
              onSubmit={chat.handleSubmit}
            />
          </div>

          {chat.toast && (
            <div className="pointer-events-none fixed bottom-[4.4rem] left-1/2 z-[60] -translate-x-1/2">
              <ToastAlert role="alert">{chat.toast.message}</ToastAlert>
            </div>
          )}
        </div>
      }
    />
  );
}

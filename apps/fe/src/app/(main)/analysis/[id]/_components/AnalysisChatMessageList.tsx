'use client';

import type { ReactNode } from 'react';
import { ChatBubble } from '@/components';
import AnalysisResult from './AnalysisResult';
import AnalyzingIndicator from './AnalyzingIndicator';
import QuestionAnalysisResult from './QuestionAnalysisResult';
import UploadedFileBadge from './UploadedFileBadge';
import VerificationResult from './VerificationResult';
import type { ChatMessage } from '@/features/analysis/hooks/useAnalysisChatMessages';
import type { AnalysisChatMessageListViewModel } from '@/features/analysis/hooks/useAnalysisChatViewModel';

type AnalysisChatMessageListProps = {
  viewModel: AnalysisChatMessageListViewModel;
};

function MessageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full justify-start">
      <div className="w-full max-w-[80%]">{children}</div>
    </div>
  );
}

export default function AnalysisChatMessageList({
  viewModel,
}: AnalysisChatMessageListProps) {
  const renderSummaryMessage = () => {
    if (!viewModel.summary) return null;

    return (
      <MessageFrame key="summary">
        <AnalysisResult
          summary={viewModel.summary}
          warningActions={viewModel.summaryWarningActions}
        />
      </MessageFrame>
    );
  };

  const renderErrorMessage = () => {
    if (!viewModel.summaryErrorMessage) return null;

    return (
      <ChatBubble key="summary-error" role="bot">
        <p className="text-error-500">{viewModel.summaryErrorMessage}</p>
      </ChatBubble>
    );
  };

  const renderMessage = (message: ChatMessage) => {
    if (message.role === 'user') {
      if (message.fileName) {
        return (
          <div
            key={message.id}
            className="flex w-full flex-col items-end gap-8"
          >
            <UploadedFileBadge fileName={message.fileName} />
            <ChatBubble role="user">{message.content}</ChatBubble>
          </div>
        );
      }

      return (
        <ChatBubble key={message.id} role="user">
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
        <MessageFrame key={message.id}>
          <VerificationResult result={message.result} />
        </MessageFrame>
      );
    }

    return (
      <MessageFrame key={message.id}>
        <QuestionAnalysisResult
          criteria={message.criteria}
          initialMode={message.initialMode}
          baseDateColumnOptions={
            viewModel.criteriaMessage.baseDateColumnOptions
          }
          groupByOptions={viewModel.criteriaMessage.groupByOptions}
          sortByOptions={viewModel.criteriaMessage.sortByOptions}
          isSubmitting={viewModel.criteriaMessage.isSubmitting}
          onContinue={(values) =>
            viewModel.criteriaMessage.onConfirm(
              message.criteria.messageId,
              values,
            )
          }
        />
      </MessageFrame>
    );
  };

  return (
    <>
      {viewModel.initialMessage
        ? renderMessage(viewModel.initialMessage)
        : null}
      {renderSummaryMessage()}
      {renderErrorMessage()}
      {viewModel.restMessages.map(renderMessage)}
      {viewModel.analyzing && (
        <MessageFrame>
          <AnalyzingIndicator
            cancelDisabled={viewModel.analyzing.cancelDisabled}
            message={viewModel.analyzing.message}
            onCancel={viewModel.analyzing.onCancel}
          />
        </MessageFrame>
      )}
    </>
  );
}

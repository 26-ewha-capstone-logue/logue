'use client';

import type { ReactNode } from 'react';
import { ChatBubble } from '@/components';
import AnalysisResult from './AnalysisResult';
import AnalyzingIndicator from './AnalyzingIndicator';
import QuestionAnalysisResult from './QuestionAnalysisResult';
import VerificationResult from './VerificationResult';
import type {
  ChatMessage,
  UseAnalysisChatResult,
} from '../_hooks/useAnalysisChat';

type AnalysisChatMessageListProps = {
  chat: Pick<
    UseAnalysisChatResult,
    | 'analyzingMessage'
    | 'criteriaSubmitting'
    | 'handleConfirmCriteria'
    | 'initialMessage'
    | 'restMessages'
    | 'shouldShowAnalyzing'
    | 'startInitialQuestion'
    | 'summary'
    | 'summaryActionDisabled'
    | 'summaryColumnOptions'
    | 'summaryErrorMessage'
    | 'summarySortOptions'
  >;
};

function MessageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full justify-start">
      <div className="w-full max-w-[80%]">{children}</div>
    </div>
  );
}

export default function AnalysisChatMessageList({
  chat,
}: AnalysisChatMessageListProps) {
  const renderSummaryMessage = () => {
    if (!chat.summary) return null;

    const hasWarnings = chat.summary.warnings.length > 0;

    return (
      <MessageFrame key="summary">
        <AnalysisResult
          summary={chat.summary}
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
      </MessageFrame>
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
            chat.summary?.dateFieldOptions.length
              ? chat.summary.dateFieldOptions
              : chat.summaryColumnOptions
          }
          groupByOptions={chat.summaryColumnOptions}
          sortByOptions={chat.summarySortOptions}
          isSubmitting={chat.criteriaSubmitting}
          onContinue={(values) =>
            chat.handleConfirmCriteria(message.criteria.messageId, values)
          }
        />
      </MessageFrame>
    );
  };

  return (
    <>
      {chat.initialMessage ? renderMessage(chat.initialMessage) : null}
      {renderSummaryMessage()}
      {renderErrorMessage()}
      {chat.restMessages.map(renderMessage)}
      {chat.shouldShowAnalyzing && (
        <MessageFrame>
          <AnalyzingIndicator message={chat.analyzingMessage} />
        </MessageFrame>
      )}
    </>
  );
}

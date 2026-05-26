'use client';

import { useCallback, useState } from 'react';
import type {
  CriteriaViewModel,
  QuestionResultViewModel,
} from '../_models/analysisViewModels';

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

function createMessageId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useAnalysisChatMessages(defaultPrompt: string) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'init-user',
      role: 'user',
      content: defaultPrompt,
      fileName: null,
    },
  ]);

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
    [],
  );

  const appendUserQuestion = useCallback((content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: createMessageId('user'),
        role: 'user',
        content,
      },
    ]);
  }, []);

  const appendCriteriaMessage = useCallback(
    (criteria: CriteriaViewModel, initialMode?: CriteriaInitialMode) => {
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
    [],
  );

  const appendResultMessage = useCallback((result: QuestionResultViewModel) => {
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
  }, []);

  const updateInitialMessage = useCallback(
    (content: string, fileName: string | null) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === 'init-user' && message.role === 'user'
            ? {
                ...message,
                content,
                fileName,
              }
            : message,
        ),
      );
    },
    [],
  );

  const [initialMessage, ...restMessages] = messages;

  return {
    appendCriteriaMessage,
    appendNotice,
    appendResultMessage,
    appendUserQuestion,
    initialMessage,
    restMessages,
    updateInitialMessage,
  };
}

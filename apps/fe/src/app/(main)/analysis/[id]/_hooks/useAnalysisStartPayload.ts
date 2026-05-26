'use client';

import { useEffect, useRef, useState, type Dispatch } from 'react';
import {
  hasAnalysisStartPayloadConsumed,
  readAnalysisStartPayload,
  type AnalysisStartPayload,
} from '@/lib/analysisStartPayload';
import type { AnalysisChatFlowAction } from './useAnalysisChatFlow';

type UseAnalysisStartPayloadParams = {
  conversationId: number | null;
  defaultPrompt: string;
  dispatchFlow: Dispatch<AnalysisChatFlowAction>;
};

export function useAnalysisStartPayload({
  conversationId,
  defaultPrompt,
  dispatchFlow,
}: UseAnalysisStartPayloadParams) {
  const readStartPayloadConversationIdRef = useRef<number | null>(null);
  const [startPayload, setStartPayload] = useState<AnalysisStartPayload>(
    () => ({
      prompt: defaultPrompt,
      fileName: null,
    }),
  );

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
        setStartPayload({ prompt: defaultPrompt, fileName: null });
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
        prompt: storedPayload?.prompt || defaultPrompt,
        fileName: storedPayload?.fileName ?? null,
      });
      dispatchFlow({
        type: 'start-payload-resolved',
        canAutoStartInitialQuestion: canAutoStart,
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [conversationId, defaultPrompt, dispatchFlow]);

  return {
    fileName: startPayload.fileName ?? null,
    initialPrompt: startPayload.prompt || defaultPrompt,
    startPayload,
  };
}

'use client';

import { useEffect, useRef, useState } from 'react';
import {
  hasAnalysisStartPayloadConsumed,
  readAnalysisStartPayload,
  type AnalysisStartPayload,
} from '@/lib/analysisStartPayload';
import type { AnalysisChatFlowActions } from './useAnalysisChatFlow';

type UseAnalysisStartPayloadParams = {
  conversationId: number | null;
  defaultPrompt: string;
  flowActions: Pick<
    AnalysisChatFlowActions,
    'startPayloadLoading' | 'startPayloadResolved'
  >;
};

export function useAnalysisStartPayload({
  conversationId,
  defaultPrompt,
  flowActions,
}: UseAnalysisStartPayloadParams) {
  const { startPayloadLoading, startPayloadResolved } = flowActions;
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

    startPayloadLoading();

    const timer = window.setTimeout(() => {
      if (conversationId === null) {
        setStartPayload({ prompt: defaultPrompt, fileName: null });
        startPayloadResolved(false);
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
      startPayloadResolved(canAutoStart);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [
    conversationId,
    defaultPrompt,
    startPayloadLoading,
    startPayloadResolved,
  ]);

  return {
    fileName: startPayload.fileName ?? null,
    initialPrompt: startPayload.prompt || defaultPrompt,
    startPayload,
  };
}

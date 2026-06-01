'use client';

import { useSearchParams } from 'next/navigation';

function parsePositiveNumber(value: string | null | undefined) {
  if (!value) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function useAnalysisRouteParams(routeConversationId: string) {
  const searchParams = useSearchParams();
  const conversationId = parsePositiveNumber(routeConversationId);
  const analysisFlowId = parsePositiveNumber(
    searchParams.get('analysisFlowId'),
  );
  const dataSourceId = parsePositiveNumber(searchParams.get('dataSourceId'));

  return {
    analysisFlowId,
    conversationId,
    dataSourceId,
    routeReady: conversationId !== null && analysisFlowId !== null,
  };
}

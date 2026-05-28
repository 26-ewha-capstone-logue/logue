export const analysisQueryKeys = {
  all: ['analysis'] as const,
  flow: (conversationId: number, analysisFlowId: number) =>
    [...analysisQueryKeys.all, 'flow', conversationId, analysisFlowId] as const,
  summary: (conversationId: number, analysisFlowId: number) =>
    [
      ...analysisQueryKeys.flow(conversationId, analysisFlowId),
      'summary',
    ] as const,
  summaryStatus: (conversationId: number, analysisFlowId: number) =>
    [
      ...analysisQueryKeys.summary(conversationId, analysisFlowId),
      'status',
    ] as const,
  criteria: (
    conversationId: number,
    analysisFlowId: number,
    messageId: number,
  ) =>
    [
      ...analysisQueryKeys.flow(conversationId, analysisFlowId),
      'messages',
      messageId,
      'criteria',
    ] as const,
  criteriaStatus: (
    conversationId: number,
    analysisFlowId: number,
    messageId: number,
  ) =>
    [
      ...analysisQueryKeys.criteria(conversationId, analysisFlowId, messageId),
      'status',
    ] as const,
  result: (
    conversationId: number,
    analysisFlowId: number,
    messageId: number,
    analysisCriteriaId: number,
  ) =>
    [
      ...analysisQueryKeys.criteria(conversationId, analysisFlowId, messageId),
      'results',
      analysisCriteriaId,
    ] as const,
  resultStatus: (
    conversationId: number,
    analysisFlowId: number,
    messageId: number,
    analysisCriteriaId: number,
  ) =>
    [
      ...analysisQueryKeys.result(
        conversationId,
        analysisFlowId,
        messageId,
        analysisCriteriaId,
      ),
      'status',
    ] as const,
};

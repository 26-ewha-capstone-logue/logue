export type AnalysisStartPayload = {
  prompt?: string | null;
  fileName?: string | null;
};

const ANALYSIS_START_PAYLOAD_PREFIX = 'analysis:start:';

function getStorage() {
  if (typeof window === 'undefined') return null;

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function getAnalysisStartPayloadKey(conversationId: number) {
  return `${ANALYSIS_START_PAYLOAD_PREFIX}${conversationId}`;
}

export function writeAnalysisStartPayload(
  conversationId: number,
  payload: AnalysisStartPayload,
) {
  const storage = getStorage();
  if (!storage) return;

  storage.setItem(
    getAnalysisStartPayloadKey(conversationId),
    JSON.stringify({
      prompt: payload.prompt?.trim() || null,
      fileName: payload.fileName?.trim() || null,
    }),
  );
}

export function readAnalysisStartPayload(conversationId: number) {
  const storage = getStorage();
  if (!storage) return null;

  const rawPayload = storage.getItem(
    getAnalysisStartPayloadKey(conversationId),
  );
  if (!rawPayload) return null;

  try {
    const payload = JSON.parse(rawPayload) as AnalysisStartPayload;

    return {
      prompt: payload.prompt?.trim() || null,
      fileName: payload.fileName?.trim() || null,
    } satisfies AnalysisStartPayload;
  } catch {
    storage.removeItem(getAnalysisStartPayloadKey(conversationId));
    return null;
  }
}

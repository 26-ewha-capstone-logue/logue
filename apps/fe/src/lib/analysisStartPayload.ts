export type AnalysisStartPayload = {
  prompt?: string | null;
  fileName?: string | null;
};

const ANALYSIS_START_PAYLOAD_PREFIX = 'analysis:start:';
const ANALYSIS_START_CONSUMED_PREFIX = 'analysis:start-consumed:';

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

function getAnalysisStartConsumedKey(conversationId: number) {
  return `${ANALYSIS_START_CONSUMED_PREFIX}${conversationId}`;
}

function safeGetItem(storage: Storage, key: string) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value);
  } catch {
    // Storage can be blocked or quota-limited.
  }
}

function safeRemoveItem(storage: Storage, key: string) {
  try {
    storage.removeItem(key);
  } catch {
    // Storage can be blocked or quota-limited.
  }
}

export function writeAnalysisStartPayload(
  conversationId: number,
  payload: AnalysisStartPayload,
) {
  const storage = getStorage();
  if (!storage) return;
  const key = getAnalysisStartPayloadKey(conversationId);

  safeSetItem(
    storage,
    key,
    JSON.stringify({
      prompt: payload.prompt?.trim() || null,
      fileName: payload.fileName?.trim() || null,
    }),
  );
  safeRemoveItem(storage, getAnalysisStartConsumedKey(conversationId));
}

export function readAnalysisStartPayload(conversationId: number) {
  const storage = getStorage();
  if (!storage) return null;
  const key = getAnalysisStartPayloadKey(conversationId);

  const rawPayload = safeGetItem(storage, key);
  if (!rawPayload) return null;

  try {
    const payload = JSON.parse(rawPayload) as AnalysisStartPayload;

    return {
      prompt: payload.prompt?.trim() || null,
      fileName: payload.fileName?.trim() || null,
    } satisfies AnalysisStartPayload;
  } catch {
    safeRemoveItem(storage, key);
    return null;
  }
}

export function hasAnalysisStartPayloadConsumed(conversationId: number) {
  const storage = getStorage();
  if (!storage) return true;

  return (
    safeGetItem(storage, getAnalysisStartConsumedKey(conversationId)) === 'true'
  );
}

export function markAnalysisStartPayloadConsumed(conversationId: number) {
  const storage = getStorage();
  if (!storage) return;

  safeSetItem(storage, getAnalysisStartConsumedKey(conversationId), 'true');
  safeRemoveItem(storage, getAnalysisStartPayloadKey(conversationId));
}

export type AnalysisDraft = {
  prompt: string;
  fileName: string | null;
};

const ANALYSIS_DRAFT_STORAGE_PREFIX = 'logue:analysis-draft:';

function getSessionStorage() {
  if (typeof window === 'undefined') return null;

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function getAnalysisDraftStorageKey(analysisId: string) {
  return `${ANALYSIS_DRAFT_STORAGE_PREFIX}${analysisId}`;
}

export function saveAnalysisDraft(analysisId: string, draft: AnalysisDraft) {
  const storage = getSessionStorage();
  if (!storage) return;

  try {
    storage.setItem(
      getAnalysisDraftStorageKey(analysisId),
      JSON.stringify(draft),
    );
  } catch {
    return;
  }
}

export function readAnalysisDraft(analysisId: string): AnalysisDraft | null {
  const storage = getSessionStorage();
  if (!storage) return null;

  let rawDraft: string | null = null;
  try {
    rawDraft = storage.getItem(getAnalysisDraftStorageKey(analysisId));
  } catch {
    return null;
  }

  if (!rawDraft) return null;

  try {
    const parsed = JSON.parse(rawDraft) as Partial<AnalysisDraft>;
    const prompt = typeof parsed.prompt === 'string' ? parsed.prompt : '';

    if (!prompt.trim()) return null;

    return {
      prompt,
      fileName: typeof parsed.fileName === 'string' ? parsed.fileName : null,
    };
  } catch {
    return null;
  }
}

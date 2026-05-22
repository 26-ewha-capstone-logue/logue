export type AuthTokens = {
  accessToken: string;
  refreshToken?: string | null;
};

export const ACCESS_TOKEN_STORAGE_KEY = 'accessToken';
export const REFRESH_TOKEN_STORAGE_KEY = 'refreshToken';
export const LEGACY_ACCESS_TOKEN_STORAGE_KEY = 'token';
export const AUTH_TOKENS_CHANGED_EVENT = 'logue:auth-tokens-changed';

function getLocalStorage() {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function notifyAuthTokensChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(AUTH_TOKENS_CHANGED_EVENT));
}

function getStorageItem(key: string) {
  const storage = getLocalStorage();
  if (!storage) return null;

  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function setStorageItem(key: string, value: string) {
  const storage = getLocalStorage();
  if (!storage) return;

  try {
    storage.setItem(key, value);
  } catch {
    // Ignore storage failures so auth redirects do not break rendering.
  }
}

function removeStorageItem(key: string) {
  const storage = getLocalStorage();
  if (!storage) return;

  try {
    storage.removeItem(key);
  } catch {
    // Ignore storage failures so logout/error handling remains best-effort.
  }
}

export function getAccessToken() {
  return (
    getStorageItem(ACCESS_TOKEN_STORAGE_KEY) ??
    getStorageItem(LEGACY_ACCESS_TOKEN_STORAGE_KEY)
  );
}

export function getRefreshToken() {
  return getStorageItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function setAuthTokens(tokens: AuthTokens) {
  const accessToken = tokens.accessToken.trim();
  const refreshToken = tokens.refreshToken?.trim();

  if (accessToken) {
    setStorageItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
    setStorageItem(LEGACY_ACCESS_TOKEN_STORAGE_KEY, accessToken);
  }

  if (refreshToken) {
    setStorageItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  }

  notifyAuthTokensChanged();
}

export function clearAuthTokens() {
  removeStorageItem(ACCESS_TOKEN_STORAGE_KEY);
  removeStorageItem(REFRESH_TOKEN_STORAGE_KEY);
  removeStorageItem(LEGACY_ACCESS_TOKEN_STORAGE_KEY);
  notifyAuthTokensChanged();
}

export function readAuthTokensFromSearchParams(
  searchParams: URLSearchParams,
): AuthTokens | null {
  const accessToken = searchParams.get('accessToken')?.trim();
  const refreshToken = searchParams.get('refreshToken')?.trim();

  if (!accessToken) return null;

  return {
    accessToken,
    refreshToken,
  };
}

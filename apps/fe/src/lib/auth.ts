export type AuthTokens = {
  accessToken: string;
  refreshToken?: string | null;
};

export const ACCESS_TOKEN_STORAGE_KEY = 'accessToken';
export const REFRESH_TOKEN_STORAGE_KEY = 'refreshToken';
export const LEGACY_ACCESS_TOKEN_STORAGE_KEY = 'token';
export const AUTH_TOKENS_CHANGED_EVENT = 'logue:auth-tokens-changed';
const AUTH_ENTRY_REDIRECT_BYPASS_STORAGE_KEY =
  'logue:auth-entry-redirect-bypass';

const MAX_AUTH_TOKEN_LENGTH = 8192;

function getOptionalLocalStorage() {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function getOptionalSessionStorage() {
  if (typeof window === 'undefined') return null;

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function notifyAuthTokensChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(AUTH_TOKENS_CHANGED_EVENT));
}

function getStorageItem(key: string) {
  const storage = getOptionalLocalStorage();
  if (!storage) return null;

  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function setStorageItem(key: string, value: string) {
  const storage = getOptionalLocalStorage();
  if (!storage) return false;

  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function removeStorageItem(key: string) {
  const storage = getOptionalLocalStorage();
  if (!storage) return false;

  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function normalizeToken(token: string | null | undefined) {
  const normalized = token?.trim();

  if (!normalized || normalized.length > MAX_AUTH_TOKEN_LENGTH) return null;

  return normalized;
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
  const accessToken = normalizeToken(tokens.accessToken);

  if (!accessToken) return;

  const didStoreAccessToken = setStorageItem(
    ACCESS_TOKEN_STORAGE_KEY,
    accessToken,
  );
  setStorageItem(LEGACY_ACCESS_TOKEN_STORAGE_KEY, accessToken);
  // Refresh rotation is not implemented in the FE yet, so avoid persisting an
  // unused long-lived credential in browser storage.
  removeStorageItem(REFRESH_TOKEN_STORAGE_KEY);

  if (didStoreAccessToken) notifyAuthTokensChanged();
}

export function clearAuthTokens() {
  removeStorageItem(ACCESS_TOKEN_STORAGE_KEY);
  removeStorageItem(REFRESH_TOKEN_STORAGE_KEY);
  removeStorageItem(LEGACY_ACCESS_TOKEN_STORAGE_KEY);
  notifyAuthTokensChanged();
}

export function skipNextAuthEntryRedirect() {
  const storage = getOptionalSessionStorage();
  if (!storage) return;

  try {
    storage.setItem(AUTH_ENTRY_REDIRECT_BYPASS_STORAGE_KEY, 'true');
  } catch {
    // Ignore browsers that block sessionStorage.
  }
}

export function consumeAuthEntryRedirectBypass() {
  const storage = getOptionalSessionStorage();
  if (!storage) return false;

  try {
    const shouldBypass =
      storage.getItem(AUTH_ENTRY_REDIRECT_BYPASS_STORAGE_KEY) === 'true';
    storage.removeItem(AUTH_ENTRY_REDIRECT_BYPASS_STORAGE_KEY);
    return shouldBypass;
  } catch {
    return false;
  }
}

export function readAuthTokensFromSearchParams(
  searchParams: URLSearchParams,
): AuthTokens | null {
  const accessToken = normalizeToken(searchParams.get('accessToken'));
  const refreshToken = normalizeToken(searchParams.get('refreshToken'));

  if (!accessToken) return null;

  return {
    accessToken,
    refreshToken,
  };
}

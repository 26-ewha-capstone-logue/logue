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
const PRIVATE_PATH_REDIRECT_BYPASS_STORAGE_KEY =
  'logue:private-path-redirect-bypass';

const MAX_AUTH_TOKEN_LENGTH = 8192;
const AUTH_TOKEN_REFRESH_BUFFER_MS = 60 * 1000;

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

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');

  return globalThis.atob(paddedBase64);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function readJwtExpiresAt(token: string | null | undefined) {
  const normalizedToken = normalizeToken(token);
  const payload = normalizedToken?.split('.')[1];

  if (!payload) return null;

  try {
    const parsedPayload: unknown = JSON.parse(decodeBase64Url(payload));

    if (!isRecord(parsedPayload) || typeof parsedPayload.exp !== 'number') {
      return null;
    }

    const expiresAt = parsedPayload.exp * 1000;

    return Number.isFinite(expiresAt) ? expiresAt : null;
  } catch {
    return null;
  }
}

export function shouldRefreshAccessToken(
  token: string | null | undefined,
  now = Date.now(),
) {
  const expiresAt = readJwtExpiresAt(token);

  if (!expiresAt) return true;

  return expiresAt - now <= AUTH_TOKEN_REFRESH_BUFFER_MS;
}

export function getAccessToken() {
  return (
    normalizeToken(getStorageItem(ACCESS_TOKEN_STORAGE_KEY)) ??
    normalizeToken(getStorageItem(LEGACY_ACCESS_TOKEN_STORAGE_KEY))
  );
}

export function getRefreshToken() {
  return normalizeToken(getStorageItem(REFRESH_TOKEN_STORAGE_KEY));
}

export function setAuthTokens(tokens: AuthTokens) {
  const accessToken = normalizeToken(tokens.accessToken);
  const refreshToken = normalizeToken(tokens.refreshToken);

  if (!accessToken) return;

  const didStoreAccessToken = setStorageItem(
    ACCESS_TOKEN_STORAGE_KEY,
    accessToken,
  );
  const didStoreLegacyAccessToken = setStorageItem(
    LEGACY_ACCESS_TOKEN_STORAGE_KEY,
    accessToken,
  );
  const didUpdateRefreshToken = refreshToken
    ? setStorageItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken)
    : removeStorageItem(REFRESH_TOKEN_STORAGE_KEY);

  if (
    didStoreAccessToken ||
    didStoreLegacyAccessToken ||
    didUpdateRefreshToken
  ) {
    notifyAuthTokensChanged();
  }
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

export function skipNextPrivatePathRedirect() {
  const storage = getOptionalSessionStorage();
  if (!storage) return;

  try {
    storage.setItem(PRIVATE_PATH_REDIRECT_BYPASS_STORAGE_KEY, 'true');
  } catch {
    // Ignore browsers that block sessionStorage.
  }
}

export function consumePrivatePathRedirectBypass() {
  const storage = getOptionalSessionStorage();
  if (!storage) return false;

  try {
    const shouldBypass =
      storage.getItem(PRIVATE_PATH_REDIRECT_BYPASS_STORAGE_KEY) === 'true';
    storage.removeItem(PRIVATE_PATH_REDIRECT_BYPASS_STORAGE_KEY);
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

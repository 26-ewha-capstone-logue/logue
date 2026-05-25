import { getApiBaseUrl } from './apiBaseUrl';
import { readAuthTokensFromSearchParams, type AuthTokens } from './auth';

const AUTH_CALLBACK_PATH = '/';
const AUTH_REDIRECT_PATH = '/analysis';
const ONBOARDING_PATH = '/onboarding';
const LOGIN_PATH = '/login';
const OAUTH_POPUP_WINDOW_NAME_PREFIX = 'logue-oauth:';
const OAUTH_POPUP_STATE_STORAGE_KEY = 'logue:oauth-popup-state';
const OAUTH_POPUP_STATE_BYTES = 16;
const OAUTH_POPUP_FEATURES =
  'popup=yes,width=480,height=720,menubar=no,toolbar=no,location=yes,status=no';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const ALLOWED_HTTPS_HOSTS = new Set([
  'asklogue.co',
  'www.asklogue.co',
  'logue-git-dev-maetelson-s-projects.vercel.app',
]);
const ALLOWED_VERCEL_HOST_SUFFIX = '-maetelson-s-projects.vercel.app';

export const OAUTH_POPUP_CALLBACK_MESSAGE_TYPE = 'logue:oauth-popup-callback';
export const OAUTH_LOGIN_POPUP_BLOCKED_MESSAGE =
  '로그인 팝업이 차단됐어요. 브라우저 팝업을 허용한 뒤 다시 시도해 주세요.';

type OAuthRedirectPath = typeof AUTH_REDIRECT_PATH | typeof ONBOARDING_PATH;
export type OAuthLoginStartResult = 'opened' | 'blocked' | 'unsupported';

export type OAuthPopupCallbackMessage = {
  type: typeof OAUTH_POPUP_CALLBACK_MESSAGE_TYPE;
  tokens: AuthTokens;
  redirectPath: OAuthRedirectPath;
  state: string;
};

export type OAuthPopupCallbackRelay = {
  message: OAuthPopupCallbackMessage;
  targetOrigin: string;
};

export function getOAuthLoginUrl() {
  return new URL('/oauth2/authorization/google', getApiBaseUrl()).toString();
}

export function getOAuthCallbackRedirectUrl(requestUrl: URL) {
  const tokens = readAuthTokensFromSearchParams(requestUrl.searchParams);

  if (!tokens) return null;
  const redirectUrl = new URL(AUTH_CALLBACK_PATH, requestUrl.origin);
  redirectUrl.searchParams.set('accessToken', tokens.accessToken);

  if (tokens.refreshToken) {
    redirectUrl.searchParams.set('refreshToken', tokens.refreshToken);
  }

  return redirectUrl;
}

function getUrlOrigin(origin: string) {
  try {
    return new URL(origin).origin;
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

function normalizePopupState(state: string | null | undefined) {
  const normalized = state?.trim();

  if (
    !normalized ||
    normalized.length > 128 ||
    !/^[A-Za-z0-9_-]+$/.test(normalized)
  ) {
    return null;
  }

  return normalized;
}

function createOAuthPopupState() {
  const bytes = new Uint8Array(OAUTH_POPUP_STATE_BYTES);

  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
      '',
    );
  }

  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
}

function storeOAuthPopupState(state: string) {
  const storage = getOptionalSessionStorage();
  if (!storage) return false;

  try {
    storage.setItem(OAUTH_POPUP_STATE_STORAGE_KEY, state);
    return true;
  } catch {
    return false;
  }
}

function clearOAuthPopupState(state?: string) {
  const storage = getOptionalSessionStorage();
  if (!storage) return;

  try {
    if (!state || storage.getItem(OAUTH_POPUP_STATE_STORAGE_KEY) === state) {
      storage.removeItem(OAUTH_POPUP_STATE_STORAGE_KEY);
    }
  } catch {
    // Ignore browsers that block sessionStorage.
  }
}

export function consumeOAuthPopupState(state: string) {
  const normalizedState = normalizePopupState(state);
  const storage = getOptionalSessionStorage();

  if (!normalizedState || !storage) return false;

  try {
    if (storage.getItem(OAUTH_POPUP_STATE_STORAGE_KEY) !== normalizedState) {
      return false;
    }

    storage.removeItem(OAUTH_POPUP_STATE_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function isAllowedOAuthPopupOrigin(origin: string) {
  const normalizedOrigin = getUrlOrigin(origin);
  if (!normalizedOrigin) return false;

  const { hostname, protocol } = new URL(normalizedOrigin);

  if (protocol === 'http:') return LOCAL_HOSTS.has(hostname);
  if (protocol !== 'https:') return false;

  return (
    ALLOWED_HTTPS_HOSTS.has(hostname) ||
    hostname.endsWith(ALLOWED_VERCEL_HOST_SUFFIX)
  );
}

export function getOAuthPopupWindowName(origin: string, state: string) {
  const normalizedOrigin = getUrlOrigin(origin);
  const normalizedState = normalizePopupState(state);

  if (
    !normalizedOrigin ||
    !normalizedState ||
    !isAllowedOAuthPopupOrigin(normalizedOrigin)
  ) {
    return null;
  }

  return `${OAUTH_POPUP_WINDOW_NAME_PREFIX}${encodeURIComponent(
    normalizedOrigin,
  )}:${normalizedState}`;
}

function getOAuthPopupTargetOrigin(windowName: string) {
  if (!windowName.startsWith(OAUTH_POPUP_WINDOW_NAME_PREFIX)) return null;

  const payload = windowName.slice(OAUTH_POPUP_WINDOW_NAME_PREFIX.length);
  const separatorIndex = payload.lastIndexOf(':');

  if (separatorIndex === -1) return null;

  const encodedOrigin = payload.slice(0, separatorIndex);
  const state = normalizePopupState(payload.slice(separatorIndex + 1));

  if (!state) return null;

  try {
    const origin = decodeURIComponent(encodedOrigin);
    const normalizedOrigin = getUrlOrigin(origin);

    if (!normalizedOrigin || !isAllowedOAuthPopupOrigin(normalizedOrigin)) {
      return null;
    }

    return {
      origin: normalizedOrigin,
      state,
    };
  } catch {
    return null;
  }
}

function getPostOAuthRedirectPath(pathname: string): OAuthRedirectPath {
  return pathname === ONBOARDING_PATH ? ONBOARDING_PATH : AUTH_REDIRECT_PATH;
}

export function getOAuthPopupCallbackRelay(
  requestUrl: URL,
  windowName: string,
): OAuthPopupCallbackRelay | null {
  const target = getOAuthPopupTargetOrigin(windowName);
  const tokens = readAuthTokensFromSearchParams(requestUrl.searchParams);

  if (!target || !tokens) return null;

  return {
    targetOrigin: target.origin,
    message: {
      type: OAUTH_POPUP_CALLBACK_MESSAGE_TYPE,
      tokens,
      redirectPath: getPostOAuthRedirectPath(requestUrl.pathname),
      state: target.state,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readMessageTokens(value: unknown) {
  if (!isRecord(value)) return null;

  const params = new URLSearchParams();

  if (typeof value.accessToken === 'string') {
    params.set('accessToken', value.accessToken);
  }

  if (typeof value.refreshToken === 'string') {
    params.set('refreshToken', value.refreshToken);
  }

  return readAuthTokensFromSearchParams(params);
}

function readRedirectPath(value: unknown): OAuthRedirectPath | null {
  if (value === AUTH_REDIRECT_PATH || value === ONBOARDING_PATH) return value;

  return null;
}

export function readOAuthPopupCallbackMessage(
  data: unknown,
  expectedState?: string,
): OAuthPopupCallbackMessage | null {
  if (!isRecord(data) || data.type !== OAUTH_POPUP_CALLBACK_MESSAGE_TYPE) {
    return null;
  }

  const tokens = readMessageTokens(data.tokens);
  const redirectPath = readRedirectPath(data.redirectPath);
  const state = normalizePopupState(
    typeof data.state === 'string' ? data.state : null,
  );

  if (!tokens || !redirectPath || !state) return null;
  if (expectedState && expectedState !== state) return null;

  return {
    type: OAUTH_POPUP_CALLBACK_MESSAGE_TYPE,
    tokens,
    redirectPath,
    state,
  };
}

export function startOAuthLogin(): OAuthLoginStartResult {
  if (typeof window === 'undefined') return 'unsupported';

  const state = createOAuthPopupState();
  const windowName = getOAuthPopupWindowName(window.location.origin, state);

  if (!windowName) {
    return 'unsupported';
  }

  if (!storeOAuthPopupState(state)) {
    return 'unsupported';
  }

  const popup = window.open(
    `${LOGIN_PATH}?mode=popup`,
    windowName,
    OAUTH_POPUP_FEATURES,
  );

  if (!popup) {
    clearOAuthPopupState(state);
    return 'blocked';
  }

  popup.focus();

  return 'opened';
}

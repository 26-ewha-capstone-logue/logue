import { getApiBaseUrl } from './apiBaseUrl';
import { readAuthTokensFromSearchParams, type AuthTokens } from './auth';

const AUTH_CALLBACK_PATH = '/';
const AUTH_REDIRECT_PATH = '/analysis';
const ONBOARDING_PATH = '/onboarding';
const LOGIN_PATH = '/login';
const OAUTH_POPUP_WINDOW_NAME_PREFIX = 'logue-oauth:';
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

type OAuthRedirectPath = typeof AUTH_REDIRECT_PATH | typeof ONBOARDING_PATH;

export type OAuthPopupCallbackMessage = {
  type: typeof OAUTH_POPUP_CALLBACK_MESSAGE_TYPE;
  tokens: AuthTokens;
  redirectPath: OAuthRedirectPath;
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

export function getOAuthPopupWindowName(origin: string) {
  const normalizedOrigin = getUrlOrigin(origin);

  if (!normalizedOrigin || !isAllowedOAuthPopupOrigin(normalizedOrigin)) {
    return null;
  }

  return `${OAUTH_POPUP_WINDOW_NAME_PREFIX}${encodeURIComponent(
    normalizedOrigin,
  )}`;
}

function getOAuthPopupTargetOrigin(windowName: string) {
  if (!windowName.startsWith(OAUTH_POPUP_WINDOW_NAME_PREFIX)) return null;

  const encodedOrigin = windowName.slice(OAUTH_POPUP_WINDOW_NAME_PREFIX.length);

  try {
    const origin = decodeURIComponent(encodedOrigin);
    const normalizedOrigin = getUrlOrigin(origin);

    if (!normalizedOrigin || !isAllowedOAuthPopupOrigin(normalizedOrigin)) {
      return null;
    }

    return normalizedOrigin;
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
  const targetOrigin = getOAuthPopupTargetOrigin(windowName);
  const tokens = readAuthTokensFromSearchParams(requestUrl.searchParams);

  if (!targetOrigin || !tokens) return null;

  return {
    targetOrigin,
    message: {
      type: OAUTH_POPUP_CALLBACK_MESSAGE_TYPE,
      tokens,
      redirectPath: getPostOAuthRedirectPath(requestUrl.pathname),
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
): OAuthPopupCallbackMessage | null {
  if (!isRecord(data) || data.type !== OAUTH_POPUP_CALLBACK_MESSAGE_TYPE) {
    return null;
  }

  const tokens = readMessageTokens(data.tokens);
  const redirectPath = readRedirectPath(data.redirectPath);

  if (!tokens || !redirectPath) return null;

  return {
    type: OAUTH_POPUP_CALLBACK_MESSAGE_TYPE,
    tokens,
    redirectPath,
  };
}

export function startOAuthLogin() {
  if (typeof window === 'undefined') return false;

  const windowName = getOAuthPopupWindowName(window.location.origin);

  if (!windowName) {
    window.location.assign(LOGIN_PATH);
    return false;
  }

  const popup = window.open(
    `${LOGIN_PATH}?mode=popup`,
    windowName,
    OAUTH_POPUP_FEATURES,
  );

  if (!popup) {
    window.location.assign(LOGIN_PATH);
    return false;
  }

  popup.focus();

  return true;
}

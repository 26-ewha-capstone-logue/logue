import { getApiBaseUrl } from './apiBaseUrl';

const AUTH_CALLBACK_PATH = '/';

export function getOAuthLoginUrl() {
  return new URL('/oauth2/authorization/google', getApiBaseUrl()).toString();
}

export function getOAuthCallbackRedirectUrl(requestUrl: URL) {
  const accessToken = requestUrl.searchParams.get('accessToken')?.trim();

  if (!accessToken) return null;

  const refreshToken = requestUrl.searchParams.get('refreshToken')?.trim();
  const redirectUrl = new URL(AUTH_CALLBACK_PATH, requestUrl.origin);
  redirectUrl.searchParams.set('accessToken', accessToken);

  if (refreshToken) {
    redirectUrl.searchParams.set('refreshToken', refreshToken);
  }

  return redirectUrl;
}

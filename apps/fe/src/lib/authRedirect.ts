import { getApiBaseUrl } from './apiBaseUrl';

export function getOAuthLoginUrl() {
  return new URL('/oauth2/authorization/google', getApiBaseUrl()).toString();
}

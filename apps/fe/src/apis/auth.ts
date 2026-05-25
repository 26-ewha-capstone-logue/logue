import axios from 'axios';
import { getApiBaseUrl } from '../lib/apiBaseUrl';
import type { AuthTokens } from '../lib/auth';
import { unwrapApiResponse, type ApiResponse } from './types';

const AUTH_API_BASE_URL = getApiBaseUrl();
const AUTH_API_TIMEOUT_MS = 10000;

export type ReissueTokenResponse = AuthTokens;

// Auth refresh must bypass the shared axios interceptor to avoid recursive 401 retries.
function getRefreshTokenHeaders(refreshToken: string) {
  return {
    Accept: 'application/json',
    'Refresh-Token': refreshToken,
  };
}

export async function reissueAuthTokens(refreshToken: string) {
  const { data } = await axios.post<ApiResponse<ReissueTokenResponse>>(
    new URL('/api/auth/reissue', AUTH_API_BASE_URL).toString(),
    undefined,
    {
      timeout: AUTH_API_TIMEOUT_MS,
      headers: getRefreshTokenHeaders(refreshToken),
    },
  );

  return unwrapApiResponse(data);
}

export async function logoutAuth(refreshToken: string) {
  const { data } = await axios.post<ApiResponse<unknown>>(
    new URL('/api/auth/logout', AUTH_API_BASE_URL).toString(),
    undefined,
    {
      timeout: AUTH_API_TIMEOUT_MS,
      headers: getRefreshTokenHeaders(refreshToken),
    },
  );

  unwrapApiResponse(data);
}

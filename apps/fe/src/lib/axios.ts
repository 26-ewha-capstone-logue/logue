import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { reissueAuthTokens } from '@/apis/auth';
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
  type AuthTokens,
} from './auth';
import { getApiBaseUrl } from './apiBaseUrl';

const API_BASE_URL = getApiBaseUrl();

type AuthRetryRequestConfig = InternalAxiosRequestConfig & {
  _authRetry?: boolean;
};

let reissueTokensRequest: Promise<AuthTokens> | null = null;

const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    Accept: 'application/json',
  },
});

instance.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

function getReissuedAuthTokens(refreshToken: string) {
  reissueTokensRequest ??= reissueAuthTokens(refreshToken).finally(() => {
    reissueTokensRequest = null;
  });

  return reissueTokensRequest;
}

instance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AuthRetryRequestConfig | undefined;

    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();

    if (!refreshToken || originalRequest._authRetry) {
      clearAuthTokens();
      return Promise.reject(error);
    }

    originalRequest._authRetry = true;

    try {
      const nextTokens = await getReissuedAuthTokens(refreshToken);
      setAuthTokens(nextTokens);
      originalRequest.headers.Authorization = `Bearer ${nextTokens.accessToken}`;
      return instance(originalRequest);
    } catch (refreshError) {
      clearAuthTokens();
      return Promise.reject(refreshError);
    }
  },
);

export default instance;

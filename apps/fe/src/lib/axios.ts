import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { reissueAuthTokens } from '../apis/auth';
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from './auth';
import { getApiBaseUrl } from './apiBaseUrl';
import {
  getSharedReissuedAuthTokens,
  getUsableRotatedAccessToken,
} from './authTokenRefresh';

const API_BASE_URL = getApiBaseUrl();

type AuthRetryRequestConfig = InternalAxiosRequestConfig & {
  _authRetry?: boolean;
};

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

instance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AuthRetryRequestConfig | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();

    if (!refreshToken || originalRequest._authRetry) {
      clearAuthTokens();
      return Promise.reject(error);
    }

    originalRequest._authRetry = true;

    try {
      const nextTokens = await getSharedReissuedAuthTokens(
        refreshToken,
        reissueAuthTokens,
      );
      setAuthTokens(nextTokens);
      originalRequest.headers.Authorization = `Bearer ${nextTokens.accessToken}`;
      return instance(originalRequest);
    } catch (refreshError) {
      const rotatedAccessToken = getUsableRotatedAccessToken(refreshToken);

      if (rotatedAccessToken) {
        originalRequest.headers.Authorization = `Bearer ${rotatedAccessToken}`;
        return instance(originalRequest);
      }

      clearAuthTokens();
      return Promise.reject(refreshError);
    }
  },
);

export default instance;

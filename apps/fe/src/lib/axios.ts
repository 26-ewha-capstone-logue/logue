import axios from 'axios';
import { clearAuthTokens, getAccessToken } from './auth';

const DEV_API_BASE_URL = 'https://api-stg.asklogue.co';

function getApiBaseUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (apiUrl) return apiUrl;

  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_API_URL must be set in production');
  }

  return DEV_API_BASE_URL;
}

const API_BASE_URL = getApiBaseUrl();

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
  (error) => {
    if (error.response?.status === 401) {
      clearAuthTokens();
    }

    return Promise.reject(error);
  },
);

export default instance;

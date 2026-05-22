import axios from 'axios';
import { clearAuthTokens, getAccessToken } from './auth';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://api-stg.asklogue.co';

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

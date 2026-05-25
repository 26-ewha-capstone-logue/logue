import type {
  AxiosAdapter,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ACCESS_TOKEN_STORAGE_KEY,
  LEGACY_ACCESS_TOKEN_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from './auth';
import instance from './axios';

function createStorage() {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  } satisfies Storage;
}

function installWindowStorage() {
  const localStorage = createStorage();
  const sessionStorage = createStorage();

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage,
      sessionStorage,
      dispatchEvent: vi.fn(),
    },
  });

  return { localStorage };
}

function createRejectedResponse(
  config: InternalAxiosRequestConfig,
  status: number,
): AxiosResponse {
  return {
    config,
    data: null,
    headers: {},
    status,
    statusText: status === 404 ? 'Not Found' : 'Error',
  };
}

const originalAdapter = instance.defaults.adapter;

afterEach(() => {
  instance.defaults.adapter = originalAdapter;
  Reflect.deleteProperty(globalThis, 'window');
  vi.restoreAllMocks();
});

describe('axios auth interceptor', () => {
  it('clears tokens when the current user no longer exists', async () => {
    installWindowStorage();
    setAuthTokens({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    const adapter: AxiosAdapter = async (config) => {
      return Promise.reject({
        config,
        isAxiosError: true,
        response: createRejectedResponse(config, 404),
        toJSON: () => ({}),
      });
    };

    instance.defaults.adapter = adapter;

    await expect(instance.get('/api/user/me')).rejects.toMatchObject({
      response: { status: 404 },
    });

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it('keeps tokens for non-auth 404 responses', async () => {
    const { localStorage } = installWindowStorage();
    setAuthTokens({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    const adapter: AxiosAdapter = async (config) => {
      return Promise.reject({
        config,
        isAxiosError: true,
        response: createRejectedResponse(config, 404),
        toJSON: () => ({}),
      });
    };

    instance.defaults.adapter = adapter;

    await expect(instance.get('/api/datasources/404')).rejects.toMatchObject({
      response: { status: 404 },
    });

    expect(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBe('access-token');
    expect(localStorage.getItem(LEGACY_ACCESS_TOKEN_STORAGE_KEY)).toBe(
      'access-token',
    );
    expect(localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)).toBe(
      'refresh-token',
    );
  });
});

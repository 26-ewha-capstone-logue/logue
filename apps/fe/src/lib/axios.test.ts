import type {
  AxiosAdapter,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { reissueAuthTokens } from '../apis/auth';
import {
  ACCESS_TOKEN_STORAGE_KEY,
  LEGACY_ACCESS_TOKEN_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from './auth';
import instance from './axios';

vi.mock('../apis/auth', () => ({
  reissueAuthTokens: vi.fn(),
}));

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

function createSuccessResponse(
  config: InternalAxiosRequestConfig,
  data: unknown = { ok: true },
): AxiosResponse {
  return {
    config,
    data,
    headers: {},
    status: 200,
    statusText: 'OK',
  };
}

function encodeBase64Url(value: unknown) {
  return Buffer.from(JSON.stringify(value))
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

function createJwt(expiresAtMs: number) {
  return `${encodeBase64Url({ alg: 'none' })}.${encodeBase64Url({
    exp: Math.floor(expiresAtMs / 1000),
  })}.signature`;
}

const originalAdapter = instance.defaults.adapter;
const mockReissueAuthTokens = vi.mocked(reissueAuthTokens);

afterEach(() => {
  instance.defaults.adapter = originalAdapter;
  Reflect.deleteProperty(globalThis, 'window');
  vi.restoreAllMocks();
});

describe('axios auth interceptor', () => {
  it('keeps tokens when the current user profile lookup returns 404', async () => {
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

    await expect(instance.get('/api/user/me')).rejects.toMatchObject({
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

  it('clears tokens when an authenticated request returns 401 without refresh token', async () => {
    installWindowStorage();
    setAuthTokens({ accessToken: 'access-token' });

    const adapter: AxiosAdapter = async (config) => {
      return Promise.reject({
        config,
        isAxiosError: true,
        response: createRejectedResponse(config, 401),
        toJSON: () => ({}),
      });
    };

    instance.defaults.adapter = adapter;

    await expect(instance.get('/api/datasources')).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it('reissues tokens and retries the original request after a 401', async () => {
    const { localStorage } = installWindowStorage();
    const nextAccessToken = createJwt(Date.now() + 120_000);
    const requests: InternalAxiosRequestConfig[] = [];
    const authorizations: unknown[] = [];
    mockReissueAuthTokens.mockResolvedValue({
      accessToken: nextAccessToken,
      refreshToken: 'next-refresh-token',
    });
    setAuthTokens({
      accessToken: 'expired-access-token',
      refreshToken: 'refresh-token',
    });

    const adapter: AxiosAdapter = async (config) => {
      requests.push(config);
      authorizations.push(config.headers.Authorization);

      if (requests.length === 1) {
        return Promise.reject({
          config,
          isAxiosError: true,
          response: createRejectedResponse(config, 401),
          toJSON: () => ({}),
        });
      }

      return createSuccessResponse(config);
    };

    instance.defaults.adapter = adapter;

    await expect(instance.get('/api/datasources')).resolves.toMatchObject({
      status: 200,
    });

    expect(mockReissueAuthTokens).toHaveBeenCalledWith('refresh-token');
    expect(requests).toHaveLength(2);
    expect(authorizations).toEqual([
      'Bearer expired-access-token',
      `Bearer ${nextAccessToken}`,
    ]);
    expect(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBe(
      nextAccessToken,
    );
    expect(localStorage.getItem(LEGACY_ACCESS_TOKEN_STORAGE_KEY)).toBe(
      nextAccessToken,
    );
    expect(localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)).toBe(
      'next-refresh-token',
    );
  });

  it('clears tokens when reissue fails without a rotated refresh token', async () => {
    installWindowStorage();
    mockReissueAuthTokens.mockRejectedValue(new Error('invalid refresh token'));
    setAuthTokens({
      accessToken: 'expired-access-token',
      refreshToken: 'refresh-token',
    });

    const adapter: AxiosAdapter = async (config) => {
      return Promise.reject({
        config,
        isAxiosError: true,
        response: createRejectedResponse(config, 401),
        toJSON: () => ({}),
      });
    };

    instance.defaults.adapter = adapter;

    await expect(instance.get('/api/datasources')).rejects.toThrow(
      'invalid refresh token',
    );

    expect(mockReissueAuthTokens).toHaveBeenCalledWith('refresh-token');
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it('retries with rotated tokens when another tab already refreshed the session', async () => {
    installWindowStorage();
    const nextAccessToken = createJwt(Date.now() + 120_000);
    const requests: InternalAxiosRequestConfig[] = [];
    const authorizations: unknown[] = [];
    mockReissueAuthTokens.mockImplementation(async () => {
      setAuthTokens({
        accessToken: nextAccessToken,
        refreshToken: 'rotated-refresh-token',
      });
      throw new Error('old refresh token was already rotated');
    });
    setAuthTokens({
      accessToken: 'expired-access-token',
      refreshToken: 'refresh-token',
    });

    const adapter: AxiosAdapter = async (config) => {
      requests.push(config);
      authorizations.push(config.headers.Authorization);

      if (requests.length === 1) {
        return Promise.reject({
          config,
          isAxiosError: true,
          response: createRejectedResponse(config, 401),
          toJSON: () => ({}),
        });
      }

      return createSuccessResponse(config);
    };

    instance.defaults.adapter = adapter;

    await expect(instance.get('/api/datasources')).resolves.toMatchObject({
      status: 200,
    });

    expect(requests).toHaveLength(2);
    expect(authorizations).toEqual([
      'Bearer expired-access-token',
      `Bearer ${nextAccessToken}`,
    ]);
    expect(getAccessToken()).toBe(nextAccessToken);
    expect(getRefreshToken()).toBe('rotated-refresh-token');
  });
});

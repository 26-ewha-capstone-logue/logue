import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ACCESS_TOKEN_STORAGE_KEY,
  LEGACY_ACCESS_TOKEN_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
  clearAuthTokens,
  consumePrivatePathRedirectBypass,
  getAccessToken,
  getRefreshToken,
  readAuthTokensFromSearchParams,
  setAuthTokens,
  skipNextPrivatePathRedirect,
} from './auth';

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
  const dispatchEvent = vi.fn();

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage,
      sessionStorage,
      dispatchEvent,
    },
  });

  return { dispatchEvent, localStorage, sessionStorage };
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'window');
  vi.restoreAllMocks();
});

describe('auth token storage', () => {
  it('stores access and refresh tokens from OAuth redirects', () => {
    const { dispatchEvent, localStorage } = installWindowStorage();

    setAuthTokens({
      accessToken: ' access-token ',
      refreshToken: ' refresh-token ',
    });

    expect(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBe('access-token');
    expect(localStorage.getItem(LEGACY_ACCESS_TOKEN_STORAGE_KEY)).toBe(
      'access-token',
    );
    expect(localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)).toBe(
      'refresh-token',
    );
    expect(getAccessToken()).toBe('access-token');
    expect(getRefreshToken()).toBe('refresh-token');
    expect(dispatchEvent).toHaveBeenCalledOnce();
  });

  it('removes stale refresh tokens when new tokens do not include one', () => {
    const { localStorage } = installWindowStorage();

    setAuthTokens({
      accessToken: 'access-token',
      refreshToken: 'old-refresh-token',
    });
    setAuthTokens({ accessToken: 'next-access-token' });

    expect(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBe(
      'next-access-token',
    );
    expect(localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it('clears all supported token keys', () => {
    const { localStorage } = installWindowStorage();

    setAuthTokens({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    clearAuthTokens();

    expect(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(LEGACY_ACCESS_TOKEN_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)).toBeNull();
  });
});

describe('private path redirect bypass', () => {
  it('consumes an intentional logout redirect bypass once', () => {
    installWindowStorage();

    skipNextPrivatePathRedirect();

    expect(consumePrivatePathRedirectBypass()).toBe(true);
    expect(consumePrivatePathRedirectBypass()).toBe(false);
  });
});

describe('readAuthTokensFromSearchParams', () => {
  it('reads and normalizes OAuth callback token params', () => {
    const tokens = readAuthTokensFromSearchParams(
      new URLSearchParams({
        accessToken: ' access-token ',
        refreshToken: ' refresh-token ',
      }),
    );

    expect(tokens).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('rejects callbacks without a usable access token', () => {
    expect(
      readAuthTokensFromSearchParams(
        new URLSearchParams({ refreshToken: 'refresh-token' }),
      ),
    ).toBeNull();
  });
});

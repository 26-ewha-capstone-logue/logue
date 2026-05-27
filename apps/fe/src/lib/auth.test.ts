import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ACCESS_TOKEN_STORAGE_KEY,
  LEGACY_ACCESS_TOKEN_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
  clearAuthTokens,
  consumePrivatePathRedirectBypass,
  getAccessToken,
  getRefreshToken,
  readJwtExpiresAt,
  readAuthTokensFromSearchParams,
  setAuthTokens,
  shouldRefreshAccessToken,
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

function encodeBase64Url(value: unknown) {
  return Buffer.from(JSON.stringify(value))
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

function createJwt(payload: Record<string, unknown>) {
  return `${encodeBase64Url({ alg: 'none' })}.${encodeBase64Url(
    payload,
  )}.signature`;
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

describe('JWT token expiry helpers', () => {
  it('reads the exp claim as milliseconds', () => {
    const token = createJwt({ exp: 1_800_000_000 });

    expect(readJwtExpiresAt(token)).toBe(1_800_000_000_000);
  });

  it('treats expired or nearly expired tokens as refresh candidates', () => {
    const now = 1_800_000_000_000;
    const expiredToken = createJwt({ exp: 1_799_999_999 });
    const nearlyExpiredToken = createJwt({ exp: 1_800_000_030 });
    const validToken = createJwt({ exp: 1_800_000_120 });

    expect(shouldRefreshAccessToken(expiredToken, now)).toBe(true);
    expect(shouldRefreshAccessToken(nearlyExpiredToken, now)).toBe(true);
    expect(shouldRefreshAccessToken(validToken, now)).toBe(false);
  });

  it('treats malformed tokens as refresh candidates', () => {
    expect(readJwtExpiresAt('not-a-jwt')).toBeNull();
    expect(readJwtExpiresAt(createJwt({ sub: 'user-1' }))).toBeNull();
    expect(shouldRefreshAccessToken('not-a-jwt')).toBe(true);
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

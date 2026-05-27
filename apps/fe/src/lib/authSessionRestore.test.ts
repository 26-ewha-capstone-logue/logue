import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ACCESS_TOKEN_STORAGE_KEY,
  LEGACY_ACCESS_TOKEN_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from './auth';
import {
  restoreAuthSession,
  type ReissueAuthTokens,
} from './authSessionRestore';

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

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'window');
  vi.restoreAllMocks();
});

describe('restoreAuthSession', () => {
  it('keeps authenticated status without reissuing when access token is still valid', async () => {
    installWindowStorage();
    const accessToken = createJwt(Date.now() + 120_000);
    const reissueAuthTokens = vi.fn<ReissueAuthTokens>();

    setAuthTokens({
      accessToken,
      refreshToken: 'refresh-token',
    });

    await expect(restoreAuthSession(reissueAuthTokens)).resolves.toBe(
      'authenticated',
    );

    expect(reissueAuthTokens).not.toHaveBeenCalled();
    expect(getAccessToken()).toBe(accessToken);
    expect(getRefreshToken()).toBe('refresh-token');
  });

  it('reissues tokens before authenticating when access token is expired', async () => {
    const { localStorage } = installWindowStorage();
    const nextAccessToken = createJwt(Date.now() + 120_000);
    const reissueAuthTokens = vi.fn<ReissueAuthTokens>().mockResolvedValue({
      accessToken: nextAccessToken,
      refreshToken: 'next-refresh-token',
    });

    setAuthTokens({
      accessToken: createJwt(Date.now() - 1_000),
      refreshToken: 'refresh-token',
    });

    await expect(restoreAuthSession(reissueAuthTokens)).resolves.toBe(
      'authenticated',
    );

    expect(reissueAuthTokens).toHaveBeenCalledWith('refresh-token');
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

  it('clears tokens and returns anonymous when reissue fails', async () => {
    installWindowStorage();
    const reissueAuthTokens = vi
      .fn<ReissueAuthTokens>()
      .mockRejectedValue(new Error('invalid refresh token'));

    setAuthTokens({
      accessToken: createJwt(Date.now() - 1_000),
      refreshToken: 'refresh-token',
    });

    await expect(restoreAuthSession(reissueAuthTokens)).resolves.toBe(
      'anonymous',
    );

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it('keeps authenticated status when another tab already rotated tokens', async () => {
    installWindowStorage();
    const nextAccessToken = createJwt(Date.now() + 120_000);
    const reissueAuthTokens = vi
      .fn<ReissueAuthTokens>()
      .mockImplementation(async () => {
        setAuthTokens({
          accessToken: nextAccessToken,
          refreshToken: 'rotated-refresh-token',
        });
        throw new Error('old refresh token was already rotated');
      });

    setAuthTokens({
      accessToken: createJwt(Date.now() - 1_000),
      refreshToken: 'refresh-token',
    });

    await expect(restoreAuthSession(reissueAuthTokens)).resolves.toBe(
      'authenticated',
    );

    expect(getAccessToken()).toBe(nextAccessToken);
    expect(getRefreshToken()).toBe('rotated-refresh-token');
  });
});

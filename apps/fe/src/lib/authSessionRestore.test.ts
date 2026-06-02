import { afterEach, describe, expect, it, vi } from 'vitest';
import { createJwt } from '../test-utils/jwt';
import { installWindowStorage } from '../test-utils/storage';
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

  it('shares in-flight token reissue while restoring concurrent sessions', async () => {
    installWindowStorage();
    const nextAccessToken = createJwt(Date.now() + 120_000);
    const reissueAuthTokens = vi.fn<ReissueAuthTokens>().mockResolvedValue({
      accessToken: nextAccessToken,
      refreshToken: 'next-refresh-token',
    });

    setAuthTokens({
      accessToken: createJwt(Date.now() - 1_000),
      refreshToken: 'refresh-token',
    });

    await expect(
      Promise.all([
        restoreAuthSession(reissueAuthTokens),
        restoreAuthSession(reissueAuthTokens),
      ]),
    ).resolves.toEqual(['authenticated', 'authenticated']);

    expect(reissueAuthTokens).toHaveBeenCalledTimes(1);
    expect(reissueAuthTokens).toHaveBeenCalledWith('refresh-token');
    expect(getAccessToken()).toBe(nextAccessToken);
    expect(getRefreshToken()).toBe('next-refresh-token');
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

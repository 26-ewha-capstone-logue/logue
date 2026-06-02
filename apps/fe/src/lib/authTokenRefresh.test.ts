import { afterEach, describe, expect, it, vi } from 'vitest';
import { createJwt } from '../test-utils/jwt';
import { installWindowStorage } from '../test-utils/storage';
import { setAuthTokens } from './auth';
import {
  getSharedReissuedAuthTokens,
  getUsableRotatedAccessToken,
  hasUsableRotatedTokens,
} from './authTokenRefresh';

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'window');
  vi.restoreAllMocks();
});

describe('auth token refresh helpers', () => {
  it('shares an in-flight token reissue request', async () => {
    const nextTokens = {
      accessToken: 'next-access-token',
      refreshToken: 'next-refresh-token',
    };
    const reissueAuthTokens = vi.fn(async () => nextTokens);

    const first = getSharedReissuedAuthTokens(
      'refresh-token',
      reissueAuthTokens,
    );
    const second = getSharedReissuedAuthTokens(
      'refresh-token',
      reissueAuthTokens,
    );

    expect(first).toBe(second);
    await expect(first).resolves.toEqual(nextTokens);
    expect(reissueAuthTokens).toHaveBeenCalledOnce();
  });

  it('detects usable tokens rotated by another refresh request', () => {
    installWindowStorage();
    const accessToken = createJwt({ exp: 1_800_000_120 });
    vi.spyOn(Date, 'now').mockReturnValue(1_800_000_000_000);

    setAuthTokens({
      accessToken,
      refreshToken: 'rotated-refresh-token',
    });

    expect(getUsableRotatedAccessToken('previous-refresh-token')).toBe(
      accessToken,
    );
    expect(hasUsableRotatedTokens('previous-refresh-token')).toBe(true);
    expect(getUsableRotatedAccessToken('rotated-refresh-token')).toBeNull();
  });
});

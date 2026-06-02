import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
  shouldRefreshAccessToken,
  type AuthTokens,
} from './auth';
import type { AuthStatus } from './authSession';
import {
  getSharedReissuedAuthTokens,
  hasUsableRotatedTokens,
} from './authTokenRefresh';

export type ReissueAuthTokens = (refreshToken: string) => Promise<AuthTokens>;

export async function restoreAuthSession(
  reissueAuthTokens: ReissueAuthTokens,
): Promise<AuthStatus> {
  const accessToken = getAccessToken();

  if (accessToken && !shouldRefreshAccessToken(accessToken)) {
    return 'authenticated';
  }

  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    if (accessToken) {
      clearAuthTokens();
    }

    return 'anonymous';
  }

  try {
    const nextTokens = await getSharedReissuedAuthTokens(
      refreshToken,
      reissueAuthTokens,
    );
    setAuthTokens(nextTokens);
    return 'authenticated';
  } catch {
    if (hasUsableRotatedTokens(refreshToken)) {
      return 'authenticated';
    }

    clearAuthTokens();
    return 'anonymous';
  }
}

import {
  getAccessToken,
  getRefreshToken,
  shouldRefreshAccessToken,
  type AuthTokens,
} from './auth';

export type ReissueAuthTokens = (refreshToken: string) => Promise<AuthTokens>;

let reissueTokensRequest: Promise<AuthTokens> | null = null;

export function getSharedReissuedAuthTokens(
  refreshToken: string,
  reissueAuthTokens: ReissueAuthTokens,
) {
  reissueTokensRequest ??= reissueAuthTokens(refreshToken).finally(() => {
    reissueTokensRequest = null;
  });

  return reissueTokensRequest;
}

export function getUsableRotatedAccessToken(previousRefreshToken: string) {
  const latestAccessToken = getAccessToken();
  const latestRefreshToken = getRefreshToken();

  if (
    latestAccessToken &&
    latestRefreshToken &&
    latestRefreshToken !== previousRefreshToken &&
    !shouldRefreshAccessToken(latestAccessToken)
  ) {
    return latestAccessToken;
  }

  return null;
}

export function hasUsableRotatedTokens(previousRefreshToken: string) {
  return !!getUsableRotatedAccessToken(previousRefreshToken);
}

import { describe, expect, it } from 'vitest';
import { getOAuthCallbackRedirectUrl } from './authRedirect';

describe('getOAuthCallbackRedirectUrl', () => {
  it('moves tokenized login callbacks to the auth callback entry', () => {
    const redirectUrl = getOAuthCallbackRedirectUrl(
      new URL(
        'https://www.asklogue.co/login?accessToken=%20access-token%20&refreshToken=%20refresh-token%20',
      ),
    );

    expect(redirectUrl?.toString()).toBe(
      'https://www.asklogue.co/?accessToken=access-token&refreshToken=refresh-token',
    );
  });

  it('omits an empty refresh token', () => {
    const redirectUrl = getOAuthCallbackRedirectUrl(
      new URL('https://www.asklogue.co/login?accessToken=access-token'),
    );

    expect(redirectUrl?.toString()).toBe(
      'https://www.asklogue.co/?accessToken=access-token',
    );
  });

  it('keeps plain login requests on the OAuth start path', () => {
    expect(
      getOAuthCallbackRedirectUrl(new URL('https://www.asklogue.co/login')),
    ).toBeNull();
  });

  it('rejects blank access token callbacks', () => {
    expect(
      getOAuthCallbackRedirectUrl(
        new URL('https://www.asklogue.co/login?accessToken=%20'),
      ),
    ).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import {
  OAUTH_POPUP_CALLBACK_MESSAGE_TYPE,
  getOAuthCallbackRedirectUrl,
  getOAuthPopupCallbackRelay,
  getOAuthPopupWindowName,
  isAllowedOAuthPopupOrigin,
  readOAuthPopupCallbackMessage,
} from './authRedirect';

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

describe('OAuth popup relay helpers', () => {
  it('creates a relay payload for a popup token callback', () => {
    const windowName = getOAuthPopupWindowName(
      'https://logue-git-fix-fe-207-maetelson-s-projects.vercel.app',
    );

    expect(windowName).not.toBeNull();

    const relay = getOAuthPopupCallbackRelay(
      new URL(
        'https://logue-git-dev-maetelson-s-projects.vercel.app/?accessToken=access-token&refreshToken=refresh-token',
      ),
      windowName ?? '',
    );

    expect(relay).toEqual({
      targetOrigin:
        'https://logue-git-fix-fe-207-maetelson-s-projects.vercel.app',
      message: {
        type: OAUTH_POPUP_CALLBACK_MESSAGE_TYPE,
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
        redirectPath: '/analysis',
      },
    });
  });

  it('routes onboarding popup callbacks back to onboarding', () => {
    const windowName = getOAuthPopupWindowName('https://www.asklogue.co');
    const relay = getOAuthPopupCallbackRelay(
      new URL(
        'https://www.asklogue.co/onboarding?accessToken=access-token&refreshToken=refresh-token',
      ),
      windowName ?? '',
    );

    expect(relay?.message.redirectPath).toBe('/onboarding');
  });

  it('rejects untrusted popup origins and malformed messages', () => {
    expect(isAllowedOAuthPopupOrigin('https://evil.example.com')).toBe(false);
    expect(getOAuthPopupWindowName('https://evil.example.com')).toBeNull();
    expect(
      readOAuthPopupCallbackMessage({
        type: OAUTH_POPUP_CALLBACK_MESSAGE_TYPE,
        tokens: { accessToken: 'access-token' },
        redirectPath: 'https://evil.example.com',
      }),
    ).toBeNull();
  });

  it('normalizes trusted popup messages', () => {
    expect(
      readOAuthPopupCallbackMessage({
        type: OAUTH_POPUP_CALLBACK_MESSAGE_TYPE,
        tokens: {
          accessToken: ' access-token ',
          refreshToken: ' refresh-token ',
        },
        redirectPath: '/analysis',
      }),
    ).toEqual({
      type: OAUTH_POPUP_CALLBACK_MESSAGE_TYPE,
      tokens: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      },
      redirectPath: '/analysis',
    });
  });
});

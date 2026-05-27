import { afterEach, describe, expect, it, vi } from 'vitest';
import { createStorage } from '../test-utils/storage';
import {
  OAUTH_LOGIN_POPUP_BLOCKED_MESSAGE,
  OAUTH_POPUP_CALLBACK_MESSAGE_TYPE,
  consumeOAuthPopupState,
  getOAuthCallbackRedirectUrl,
  getOAuthPopupCallbackRelay,
  getOAuthPopupWindowName,
  isAllowedOAuthPopupOrigin,
  readOAuthPopupCallbackMessage,
  startOAuthLogin,
} from './authRedirect';

function installWindow(openResult: Window | null) {
  const sessionStorage = createStorage();
  const assign = vi.fn();
  const open = vi.fn(() => openResult);

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      crypto: {
        getRandomValues: (bytes: Uint8Array) => {
          bytes.fill(1);
          return bytes;
        },
      },
      location: {
        assign,
        origin: 'https://logue-git-fix-fe-207-maetelson-s-projects.vercel.app',
      },
      open,
      sessionStorage,
    },
  });

  return { assign, open, sessionStorage };
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'window');
  vi.restoreAllMocks();
});

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
      'state-1',
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
        state: 'state-1',
      },
    });
  });

  it('routes onboarding popup callbacks back to onboarding', () => {
    const windowName = getOAuthPopupWindowName(
      'https://www.asklogue.co',
      'state-1',
    );
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
    expect(
      getOAuthPopupWindowName('https://evil.example.com', 'state-1'),
    ).toBeNull();
    expect(
      readOAuthPopupCallbackMessage({
        type: OAUTH_POPUP_CALLBACK_MESSAGE_TYPE,
        tokens: { accessToken: 'access-token' },
        redirectPath: 'https://evil.example.com',
        state: 'state-1',
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
        state: 'state-1',
      }),
    ).toEqual({
      type: OAUTH_POPUP_CALLBACK_MESSAGE_TYPE,
      tokens: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      },
      redirectPath: '/analysis',
      state: 'state-1',
    });
  });

  it('rejects callback messages when the popup state does not match', () => {
    expect(
      readOAuthPopupCallbackMessage(
        {
          type: OAUTH_POPUP_CALLBACK_MESSAGE_TYPE,
          tokens: { accessToken: 'access-token' },
          redirectPath: '/analysis',
          state: 'actual-state',
        },
        'expected-state',
      ),
    ).toBeNull();
  });

  it('does not fall back to same-tab login when the popup is blocked', () => {
    const { assign, open } = installWindow(null);

    expect(startOAuthLogin()).toBe('blocked');
    expect(open).toHaveBeenCalledOnce();
    expect(assign).not.toHaveBeenCalled();
  });

  it('stores a pending popup state and consumes it only once', () => {
    const popup = { focus: vi.fn() } as unknown as Window;
    installWindow(popup);

    expect(startOAuthLogin()).toBe('opened');
    expect(consumeOAuthPopupState('01010101010101010101010101010101')).toBe(
      true,
    );
    expect(consumeOAuthPopupState('01010101010101010101010101010101')).toBe(
      false,
    );
  });

  it('exposes the popup blocked message used by login buttons', () => {
    expect(OAUTH_LOGIN_POPUP_BLOCKED_MESSAGE).toContain('팝업');
  });
});

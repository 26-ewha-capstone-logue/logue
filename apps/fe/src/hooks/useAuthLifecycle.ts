'use client';

import { useCallback, useEffect } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { reissueAuthTokens } from '@/apis/auth';
import {
  ACCESS_TOKEN_STORAGE_KEY,
  AUTH_TOKENS_CHANGED_EVENT,
  LEGACY_ACCESS_TOKEN_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
  consumeAuthEntryRedirectBypass,
  consumePrivatePathRedirectBypass,
  readAuthTokensFromSearchParams,
  setAuthTokens,
} from '@/lib/auth';
import {
  consumeOAuthPopupState,
  getOAuthPopupCallbackRelay,
  isAllowedOAuthPopupOrigin,
  readOAuthPopupCallbackMessage,
} from '@/lib/authRedirect';
import {
  AUTH_REDIRECT_PATH,
  getLoginRedirectPath,
  getPostAuthRedirectPath,
  shouldRedirectAuthenticatedUser,
  shouldRedirectPrivatePath,
  type AuthStatus,
} from '@/lib/authSession';
import { restoreAuthSession } from '@/lib/authSessionRestore';

type SetAuthStatus = (status: AuthStatus) => void;

function removeTokenParamsFromCurrentUrl(url: URL) {
  const shouldReplace =
    url.searchParams.has('accessToken') || url.searchParams.has('refreshToken');

  if (!shouldReplace) return;

  url.searchParams.delete('accessToken');
  url.searchParams.delete('refreshToken');
  window.history.replaceState(
    window.history.state,
    '',
    `${url.pathname}${url.search}${url.hash}`,
  );
}

function replaceLocation(pathname: string) {
  window.location.replace(pathname);
}

function useOAuthCallbackHandler({
  pathname,
  queryClient,
}: {
  pathname: string;
  queryClient: QueryClient;
}) {
  return useCallback(() => {
    const currentUrl = new URL(window.location.href);
    const redirectedTokens = readAuthTokensFromSearchParams(
      currentUrl.searchParams,
    );

    if (!redirectedTokens) return false;

    const popupRelay = getOAuthPopupCallbackRelay(currentUrl, window.name);

    if (popupRelay && window.opener) {
      removeTokenParamsFromCurrentUrl(currentUrl);
      window.opener.postMessage(popupRelay.message, popupRelay.targetOrigin);
      window.close();
      return true;
    }

    setAuthTokens(redirectedTokens);
    removeTokenParamsFromCurrentUrl(currentUrl);
    queryClient.clear();
    replaceLocation(getPostAuthRedirectPath(pathname));
    return true;
  }, [pathname, queryClient]);
}

function useOAuthPopupMessageHandler({
  queryClient,
  setStatus,
}: {
  queryClient: QueryClient;
  setStatus: SetAuthStatus;
}) {
  return useCallback(
    (event: MessageEvent) => {
      if (!isAllowedOAuthPopupOrigin(event.origin)) return;

      const message = readOAuthPopupCallbackMessage(event.data);
      if (!message) return;
      if (!consumeOAuthPopupState(message.state)) return;

      setAuthTokens(message.tokens);
      queryClient.clear();
      setStatus('authenticated');
      replaceLocation(message.redirectPath);
    },
    [queryClient, setStatus],
  );
}

export function useAuthLifecycle({
  pathname,
  queryClient,
  setStatus,
}: {
  pathname: string;
  queryClient: QueryClient;
  setStatus: SetAuthStatus;
}) {
  const handleOAuthCallback = useOAuthCallbackHandler({
    pathname,
    queryClient,
  });
  const handleMessage = useOAuthPopupMessageHandler({
    queryClient,
    setStatus,
  });

  useEffect(() => {
    if (handleOAuthCallback()) return;

    let isActive = true;
    let isRestoring = false;

    const applyStatus = (
      nextStatus: AuthStatus,
      shouldCheckAuthEntryRedirect: boolean,
    ) => {
      setStatus(nextStatus);

      if (nextStatus === 'anonymous') {
        queryClient.clear();

        if (
          shouldRedirectPrivatePath(nextStatus, pathname) &&
          !consumePrivatePathRedirectBypass()
        ) {
          replaceLocation(getLoginRedirectPath(new URL(window.location.href)));
        }

        return;
      }

      const shouldBypassAuthEntryRedirect =
        shouldCheckAuthEntryRedirect &&
        shouldRedirectAuthenticatedUser(pathname) &&
        consumeAuthEntryRedirectBypass();

      if (
        shouldCheckAuthEntryRedirect &&
        shouldRedirectAuthenticatedUser(pathname) &&
        !shouldBypassAuthEntryRedirect
      ) {
        replaceLocation(AUTH_REDIRECT_PATH);
      }
    };

    const restoreAndApply = async (shouldCheckAuthEntryRedirect: boolean) => {
      if (isRestoring) return;

      isRestoring = true;

      try {
        const nextStatus = await restoreAuthSession(reissueAuthTokens);

        if (!isActive) return;

        applyStatus(nextStatus, shouldCheckAuthEntryRedirect);
      } finally {
        isRestoring = false;
      }
    };

    void restoreAndApply(true);

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === ACCESS_TOKEN_STORAGE_KEY ||
        event.key === REFRESH_TOKEN_STORAGE_KEY ||
        event.key === LEGACY_ACCESS_TOKEN_STORAGE_KEY
      ) {
        void restoreAndApply(false);
      }
    };

    const handleAuthTokensChanged = () => {
      void restoreAndApply(false);
    };

    window.addEventListener(AUTH_TOKENS_CHANGED_EVENT, handleAuthTokensChanged);
    window.addEventListener('message', handleMessage);
    window.addEventListener('storage', handleStorage);

    return () => {
      isActive = false;
      window.removeEventListener(
        AUTH_TOKENS_CHANGED_EVENT,
        handleAuthTokensChanged,
      );
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
    };
  }, [handleMessage, handleOAuthCallback, pathname, queryClient, setStatus]);
}

'use client';

import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';
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
import { getPostAuthRedirectPath, type AuthStatus } from '@/lib/authSession';
import { restoreAuthSession } from '@/lib/authSessionRestore';
import {
  getAuthRouteBypassRequirements,
  getAuthRouteDecision,
} from '@/lib/authSessionService';

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

function useAuthStatusApplier({
  pathname,
  queryClient,
  setStatus,
}: {
  pathname: string;
  queryClient: QueryClient;
  setStatus: SetAuthStatus;
}) {
  return useCallback(
    (nextStatus: AuthStatus, shouldCheckAuthEntryRedirect: boolean) => {
      setStatus(nextStatus);

      if (nextStatus === 'anonymous') {
        queryClient.clear();
      }

      const bypassRequirements = getAuthRouteBypassRequirements({
        pathname,
        shouldCheckAuthEntryRedirect,
        status: nextStatus,
      });
      const routeDecision = getAuthRouteDecision({
        currentUrl: new URL(window.location.href),
        pathname,
        shouldBypassAuthEntryRedirect:
          bypassRequirements.authEntry && consumeAuthEntryRedirectBypass(),
        shouldBypassPrivatePathRedirect:
          bypassRequirements.privatePath && consumePrivatePathRedirectBypass(),
        shouldCheckAuthEntryRedirect,
        status: nextStatus,
      });

      if (routeDecision.type === 'replace') {
        replaceLocation(routeDecision.path);
      }
    },
    [pathname, queryClient, setStatus],
  );
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

function useAuthSessionRestoreHandler(
  applyStatus: (
    nextStatus: AuthStatus,
    shouldCheckAuthEntryRedirect: boolean,
  ) => void,
) {
  const isActiveRef = useRef(false);
  const isRestoringRef = useRef(false);

  useEffect(() => {
    isActiveRef.current = true;

    return () => {
      isActiveRef.current = false;
    };
  }, []);

  return useCallback(
    async (shouldCheckAuthEntryRedirect: boolean) => {
      if (isRestoringRef.current) return;

      isRestoringRef.current = true;

      try {
        const nextStatus = await restoreAuthSession(reissueAuthTokens);

        if (!isActiveRef.current) return;

        applyStatus(nextStatus, shouldCheckAuthEntryRedirect);
      } finally {
        isRestoringRef.current = false;
      }
    },
    [applyStatus],
  );
}

function useOAuthCallbackEffect({
  handleOAuthCallback,
  handledOAuthCallbackRef,
}: {
  handleOAuthCallback: () => boolean;
  handledOAuthCallbackRef: MutableRefObject<boolean>;
}) {
  useEffect(() => {
    handledOAuthCallbackRef.current = handleOAuthCallback();
  }, [handleOAuthCallback, handledOAuthCallbackRef]);
}

function useInitialAuthRestoreEffect({
  handledOAuthCallbackRef,
  restoreAndApply,
}: {
  handledOAuthCallbackRef: MutableRefObject<boolean>;
  restoreAndApply: (shouldCheckAuthEntryRedirect: boolean) => Promise<void>;
}) {
  useEffect(() => {
    if (handledOAuthCallbackRef.current) return;

    void restoreAndApply(true);
  }, [handledOAuthCallbackRef, restoreAndApply]);
}

function useOAuthPopupMessageEffect(
  handleMessage: (event: MessageEvent) => void,
) {
  useEffect(() => {
    window.addEventListener('message', handleMessage);

    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);
}

function useAuthStorageSyncEffect(
  restoreAndApply: (shouldCheckAuthEntryRedirect: boolean) => Promise<void>,
) {
  useEffect(() => {
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
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(
        AUTH_TOKENS_CHANGED_EVENT,
        handleAuthTokensChanged,
      );
      window.removeEventListener('storage', handleStorage);
    };
  }, [restoreAndApply]);
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
  const handledOAuthCallbackRef = useRef(false);
  const applyStatus = useAuthStatusApplier({
    pathname,
    queryClient,
    setStatus,
  });
  const handleOAuthCallback = useOAuthCallbackHandler({
    pathname,
    queryClient,
  });
  const handleMessage = useOAuthPopupMessageHandler({
    queryClient,
    setStatus,
  });
  const restoreAndApply = useAuthSessionRestoreHandler(applyStatus);

  useOAuthCallbackEffect({
    handleOAuthCallback,
    handledOAuthCallbackRef,
  });
  useInitialAuthRestoreEffect({
    handledOAuthCallbackRef,
    restoreAndApply,
  });
  useOAuthPopupMessageEffect(handleMessage);
  useAuthStorageSyncEffect(restoreAndApply);
}

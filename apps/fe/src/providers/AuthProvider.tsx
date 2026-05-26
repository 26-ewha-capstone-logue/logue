'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import {
  ACCESS_TOKEN_STORAGE_KEY,
  AUTH_TOKENS_CHANGED_EVENT,
  LEGACY_ACCESS_TOKEN_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
  consumeAuthEntryRedirectBypass,
  consumePrivatePathRedirectBypass,
  getAccessToken,
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

type AuthContextValue = {
  status: AuthStatus;
  hasAccessToken: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

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

function useAuthTokenSync({
  pathname,
  queryClient,
  setStatus,
}: {
  pathname: string;
  queryClient: QueryClient;
  setStatus: SetAuthStatus;
}) {
  return useCallback(() => {
    const nextStatus: AuthStatus = getAccessToken()
      ? 'authenticated'
      : 'anonymous';

    setStatus(nextStatus);

    if (nextStatus === 'anonymous') {
      queryClient.clear();

      if (
        shouldRedirectPrivatePath(nextStatus, pathname) &&
        !consumePrivatePathRedirectBypass()
      ) {
        replaceLocation(getLoginRedirectPath(new URL(window.location.href)));
      }
    }

    return nextStatus;
  }, [pathname, queryClient, setStatus]);
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

function useAuthLifecycle({
  pathname,
  queryClient,
  setStatus,
}: {
  pathname: string;
  queryClient: QueryClient;
  setStatus: SetAuthStatus;
}) {
  const syncAccessToken = useAuthTokenSync({
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

  useEffect(() => {
    if (handleOAuthCallback()) return;

    const nextStatus = syncAccessToken();
    const shouldBypassAuthEntryRedirect =
      shouldRedirectAuthenticatedUser(pathname) &&
      consumeAuthEntryRedirectBypass();

    if (
      nextStatus === 'authenticated' &&
      shouldRedirectAuthenticatedUser(pathname) &&
      !shouldBypassAuthEntryRedirect
    ) {
      replaceLocation(AUTH_REDIRECT_PATH);
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === ACCESS_TOKEN_STORAGE_KEY ||
        event.key === REFRESH_TOKEN_STORAGE_KEY ||
        event.key === LEGACY_ACCESS_TOKEN_STORAGE_KEY
      ) {
        syncAccessToken();
      }
    };

    window.addEventListener(AUTH_TOKENS_CHANGED_EVENT, syncAccessToken);
    window.addEventListener('message', handleMessage);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(AUTH_TOKENS_CHANGED_EVENT, syncAccessToken);
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
    };
  }, [handleMessage, handleOAuthCallback, pathname, syncAccessToken]);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>('initializing');

  useAuthLifecycle({
    pathname,
    queryClient,
    setStatus,
  });

  const hasAccessToken = status === 'authenticated';
  const value = useMemo(
    () => ({
      status,
      hasAccessToken,
    }),
    [hasAccessToken, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthSession() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthSession must be used within AuthProvider');
  }

  return context;
}

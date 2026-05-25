'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import {
  ACCESS_TOKEN_STORAGE_KEY,
  AUTH_TOKENS_CHANGED_EVENT,
  LEGACY_ACCESS_TOKEN_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
  consumeAuthEntryRedirectBypass,
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

export default function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>('initializing');

  useEffect(() => {
    const syncAccessToken = () => {
      const nextStatus: AuthStatus = getAccessToken()
        ? 'authenticated'
        : 'anonymous';

      setStatus(nextStatus);

      if (nextStatus === 'anonymous') {
        queryClient.clear();

        if (shouldRedirectPrivatePath(nextStatus, pathname)) {
          replaceLocation(getLoginRedirectPath(new URL(window.location.href)));
        }
      }

      return nextStatus;
    };

    const currentUrl = new URL(window.location.href);
    const redirectedTokens = readAuthTokensFromSearchParams(
      currentUrl.searchParams,
    );

    if (redirectedTokens) {
      const popupRelay = getOAuthPopupCallbackRelay(currentUrl, window.name);

      if (popupRelay && window.opener) {
        removeTokenParamsFromCurrentUrl(currentUrl);
        window.opener.postMessage(popupRelay.message, popupRelay.targetOrigin);
        window.close();
        return;
      }

      setAuthTokens(redirectedTokens);
      removeTokenParamsFromCurrentUrl(currentUrl);
      queryClient.clear();
      replaceLocation(getPostAuthRedirectPath(pathname));
      return;
    }

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

    const handleMessage = (event: MessageEvent) => {
      if (!isAllowedOAuthPopupOrigin(event.origin)) return;

      const message = readOAuthPopupCallbackMessage(event.data);
      if (!message) return;
      if (!consumeOAuthPopupState(message.state)) return;

      setAuthTokens(message.tokens);
      queryClient.clear();
      setStatus('authenticated');
      replaceLocation(message.redirectPath);
    };

    window.addEventListener(AUTH_TOKENS_CHANGED_EVENT, syncAccessToken);
    window.addEventListener('message', handleMessage);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(AUTH_TOKENS_CHANGED_EVENT, syncAccessToken);
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
    };
  }, [pathname, queryClient]);

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

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
  consumePrivatePathRedirectBypass,
  getAccessToken,
  readAuthTokensFromSearchParams,
  setAuthTokens,
} from '@/lib/auth';

const LOGIN_PATH = '/login';
const PRIVATE_PATH_PREFIXES = ['/analysis', '/data', '/history'];
const AUTH_REDIRECT_PATH = '/analysis';
const ONBOARDING_PATH = '/onboarding';
const AUTH_ENTRY_PATHS = new Set(['/', '/login']);

type AuthContextValue = {
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

function isPrivatePath(pathname: string) {
  return PRIVATE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function shouldRedirectAuthenticatedUser(pathname: string) {
  return AUTH_ENTRY_PATHS.has(pathname);
}

function replaceLocation(pathname: string) {
  window.location.replace(pathname);
}

function getPostAuthRedirectPath(pathname: string) {
  if (pathname === ONBOARDING_PATH) return ONBOARDING_PATH;
  if (shouldRedirectAuthenticatedUser(pathname)) return AUTH_REDIRECT_PATH;

  return pathname;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [hasAccessToken, setHasAccessToken] = useState(false);

  useEffect(() => {
    const syncAccessToken = () => {
      const nextHasAccessToken = Boolean(getAccessToken());

      setHasAccessToken(nextHasAccessToken);

      if (!nextHasAccessToken) {
        queryClient.clear();

        if (isPrivatePath(pathname) && !consumePrivatePathRedirectBypass()) {
          replaceLocation(LOGIN_PATH);
        }
      }

      return nextHasAccessToken;
    };

    const currentUrl = new URL(window.location.href);
    const redirectedTokens = readAuthTokensFromSearchParams(
      currentUrl.searchParams,
    );

    if (redirectedTokens) {
      setAuthTokens(redirectedTokens);
      removeTokenParamsFromCurrentUrl(currentUrl);
      replaceLocation(getPostAuthRedirectPath(pathname));
      return;
    }

    const nextHasAccessToken = syncAccessToken();
    const shouldBypassAuthEntryRedirect =
      shouldRedirectAuthenticatedUser(pathname) &&
      consumeAuthEntryRedirectBypass();

    if (
      !redirectedTokens &&
      nextHasAccessToken &&
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
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(AUTH_TOKENS_CHANGED_EVENT, syncAccessToken);
      window.removeEventListener('storage', handleStorage);
    };
  }, [pathname, queryClient]);

  const value = useMemo(
    () => ({
      hasAccessToken,
    }),
    [hasAccessToken],
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

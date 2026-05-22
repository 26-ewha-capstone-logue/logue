'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  ACCESS_TOKEN_STORAGE_KEY,
  AUTH_TOKENS_CHANGED_EVENT,
  LEGACY_ACCESS_TOKEN_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
  getAccessToken,
  readAuthTokensFromSearchParams,
  setAuthTokens,
} from '@/lib/auth';

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

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [hasAccessToken, setHasAccessToken] = useState(false);

  useEffect(() => {
    const syncAccessToken = () => {
      setHasAccessToken(Boolean(getAccessToken()));
    };

    const currentUrl = new URL(window.location.href);
    const redirectedTokens = readAuthTokensFromSearchParams(
      currentUrl.searchParams,
    );

    if (redirectedTokens) {
      setAuthTokens(redirectedTokens);
      removeTokenParamsFromCurrentUrl(currentUrl);
    }

    syncAccessToken();

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
  }, []);

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

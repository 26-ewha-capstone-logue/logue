'use client';

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import type { AuthStatus } from '@/lib/authSession';
import { useAuthLifecycle } from '@/hooks/useAuthLifecycle';

type AuthContextValue = {
  status: AuthStatus;
  hasAccessToken: boolean;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>('initializing');

  useAuthLifecycle({
    pathname,
    queryClient,
    setStatus,
  });

  const isAuthenticated = status === 'authenticated';
  const hasAccessToken = isAuthenticated;
  const value = useMemo(
    () => ({
      status,
      hasAccessToken,
      isAuthenticated,
    }),
    [hasAccessToken, isAuthenticated, status],
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

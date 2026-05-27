'use client';

import { useAuthSession } from '@/providers/AuthProvider';
import { useMyInfo } from './useMyInfo';

export function useAuthenticatedUser() {
  const { hasAccessToken, isAuthenticated, status } = useAuthSession();
  const {
    data: myInfo,
    isError: isUserInfoError,
    isLoading: isUserInfoLoading,
  } = useMyInfo(isAuthenticated);

  return {
    hasAccessToken,
    isAuthenticated,
    isUserInfoError,
    isUserInfoLoading,
    myInfo,
    status,
  };
}

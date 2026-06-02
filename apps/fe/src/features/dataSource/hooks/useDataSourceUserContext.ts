'use client';

import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { useMockDataSourceManager } from '@/features/mockDataSource';

export function useDataSourceUserContext() {
  const authenticatedUser = useAuthenticatedUser();
  const mockDataSource = useMockDataSourceManager(authenticatedUser.myInfo?.id);

  return {
    ...authenticatedUser,
    mockDataSource,
  };
}

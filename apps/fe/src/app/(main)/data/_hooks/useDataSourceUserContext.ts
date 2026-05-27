'use client';

import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { useDeletedMockDataSources } from './useDeletedMockDataSources';

export function useDataSourceUserContext() {
  const authenticatedUser = useAuthenticatedUser();
  const { deletedMockDataSourceIds, markDeletedMockDataSources } =
    useDeletedMockDataSources(authenticatedUser.myInfo?.id);

  return {
    ...authenticatedUser,
    deletedMockDataSourceIds,
    markDeletedMockDataSources,
  };
}

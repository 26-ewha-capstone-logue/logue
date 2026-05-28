'use client';

import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteDataSources } from '@/apis/dataSourceRepository';
import { dataSourceKeys } from '@/apis/datasource';
import {
  getMockDataSourceIds,
  getServerDataSourceIds,
} from '@/apis/mockDataSource';
import { AUTH_MESSAGES } from '@/constants/messages';
import { getDataSourceDeleteErrorMessage } from '../_utils/dataSourceErrorMessage';

type UseDeleteDataSourcesOptions = {
  conflictErrorMessage: string;
  fallbackErrorMessage: string;
  onDeletedMockDataSources: (dataSourceIds: number[]) => void;
  onError: (message: string) => void;
  onSuccess: () => void;
  userId?: number | null;
};

export function useDeleteDataSources({
  conflictErrorMessage,
  fallbackErrorMessage,
  onDeletedMockDataSources,
  onError,
  onSuccess,
  userId,
}: UseDeleteDataSourcesOptions) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: deleteDataSources,
  });

  const remove = useCallback(
    async (dataSourceIds: number[]) => {
      if (dataSourceIds.length === 0) return;

      const mockDataSourceIds = getMockDataSourceIds(dataSourceIds);
      const serverDataSourceIds = getServerDataSourceIds(dataSourceIds);

      if (mockDataSourceIds.length > 0 && userId == null) {
        onError(AUTH_MESSAGES.userInfoRequired);
        return;
      }

      try {
        if (serverDataSourceIds.length > 0) {
          await mutation.mutateAsync(serverDataSourceIds);
        }

        if (mockDataSourceIds.length > 0 && userId != null) {
          onDeletedMockDataSources(mockDataSourceIds);
        }

        await queryClient.invalidateQueries({
          queryKey: dataSourceKeys.lists(),
        });
        onSuccess();
      } catch (error) {
        onError(
          getDataSourceDeleteErrorMessage(error, {
            conflict: conflictErrorMessage,
            fallback: fallbackErrorMessage,
          }),
        );
      }
    },
    [
      conflictErrorMessage,
      fallbackErrorMessage,
      mutation,
      onDeletedMockDataSources,
      onError,
      onSuccess,
      queryClient,
      userId,
    ],
  );

  return {
    isPending: mutation.isPending,
    remove,
  };
}

'use client';

import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AUTH_MESSAGES } from '@/constants/messages';
import { dataSourceKeys, deleteDataSources } from '@/features/dataSource';
import type { MockDataSourceManager } from '@/features/mockDataSource';
import { getDataSourceDeleteErrorMessage } from '../utils/dataSourceErrorMessage';

type UseDeleteDataSourcesOptions = {
  conflictErrorMessage: string;
  fallbackErrorMessage: string;
  mockDataSource: Pick<
    MockDataSourceManager,
    'canPersistDeletedDataSources' | 'markDeletedDataSources'
  >;
  onError: (message: string) => void;
  onSuccess: () => void;
};

export function useDeleteDataSources({
  conflictErrorMessage,
  fallbackErrorMessage,
  mockDataSource,
  onError,
  onSuccess,
}: UseDeleteDataSourcesOptions) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: deleteDataSources,
  });

  const remove = useCallback(
    async (dataSourceIds: number[]) => {
      if (dataSourceIds.length === 0) return;

      if (!mockDataSource.canPersistDeletedDataSources(dataSourceIds)) {
        onError(AUTH_MESSAGES.userInfoRequired);
        return;
      }

      try {
        const result = await mutation.mutateAsync(dataSourceIds);

        if (result.deletedMockDataSourceIds.length > 0) {
          mockDataSource.markDeletedDataSources(
            result.deletedMockDataSourceIds,
          );
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
      mockDataSource,
      mutation,
      onError,
      onSuccess,
      queryClient,
    ],
  );

  return {
    isPending: mutation.isPending,
    remove,
  };
}

'use client';

import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AUTH_MESSAGES } from '@/constants/messages';
import { dataSourceKeys, deleteDataSources } from '@/features/dataSource';
import type { MockDataSourceManager } from '@/features/mockDataSource';
import { getDataSourceDeleteErrorMessage } from '../_utils/dataSourceErrorMessage';

type UseDeleteDataSourcesOptions = {
  conflictErrorMessage: string;
  fallbackErrorMessage: string;
  mockDataSource: Pick<
    MockDataSourceManager,
    'getDeletionPlan' | 'markDeletedDataSources'
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

      const deletionPlan = mockDataSource.getDeletionPlan(dataSourceIds);

      if (deletionPlan.requiresUser) {
        onError(AUTH_MESSAGES.userInfoRequired);
        return;
      }

      try {
        if (deletionPlan.serverDataSourceIds.length > 0) {
          await mutation.mutateAsync(deletionPlan.serverDataSourceIds);
        }

        if (deletionPlan.mockDataSourceIds.length > 0) {
          mockDataSource.markDeletedDataSources(deletionPlan.mockDataSourceIds);
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

'use client';

import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteDataSources } from '@/apis/dataSourceRepository';
import { dataSourceKeys } from '@/apis/datasource';
import { getApiErrorMessage, isApiConflictError } from '@/apis/errors';
import { isMockDataSourceId } from '@/apis/mockDataSource';

const USER_INFO_REQUIRED_MESSAGE =
  '사용자 정보를 확인한 뒤 다시 시도해 주세요.';

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

      const mockDataSourceIds = dataSourceIds.filter(isMockDataSourceId);
      const serverDataSourceIds = dataSourceIds.filter(
        (dataSourceId) => !isMockDataSourceId(dataSourceId),
      );

      if (mockDataSourceIds.length > 0 && !userId) {
        onError(USER_INFO_REQUIRED_MESSAGE);
        return;
      }

      try {
        if (serverDataSourceIds.length > 0) {
          await mutation.mutateAsync(serverDataSourceIds);
        }

        if (mockDataSourceIds.length > 0 && userId) {
          onDeletedMockDataSources(mockDataSourceIds);
        }

        await queryClient.invalidateQueries({
          queryKey: dataSourceKeys.lists(),
        });
        onSuccess();
      } catch (error) {
        onError(
          isApiConflictError(error)
            ? conflictErrorMessage
            : getApiErrorMessage(error, fallbackErrorMessage),
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

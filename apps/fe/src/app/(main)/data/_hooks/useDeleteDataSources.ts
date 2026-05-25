'use client';

import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dataSourceKeys, deleteDataSources } from '@/apis/datasource';
import { getApiErrorMessage } from '@/apis/errors';

type UseDeleteDataSourcesOptions = {
  fallbackErrorMessage: string;
  onError: (message: string) => void;
  onSuccess: () => void;
};

export function useDeleteDataSources({
  fallbackErrorMessage,
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

      try {
        await mutation.mutateAsync(dataSourceIds);
        await queryClient.invalidateQueries({
          queryKey: dataSourceKeys.lists(),
        });
        onSuccess();
      } catch (error) {
        onError(getApiErrorMessage(error, fallbackErrorMessage));
      }
    },
    [fallbackErrorMessage, mutation, onError, onSuccess, queryClient],
  );

  return {
    isPending: mutation.isPending,
    remove,
  };
}

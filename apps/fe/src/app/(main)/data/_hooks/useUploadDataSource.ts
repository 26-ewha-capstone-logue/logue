'use client';

import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dataSourceKeys, uploadDataSource } from '@/apis/datasource';
import { getApiErrorMessage } from '@/apis/errors';

type UseUploadDataSourceOptions = {
  fallbackErrorMessage: string;
  hasAccessToken: boolean;
  loginRequiredMessage: string;
  onSuccess: () => void;
};

export function useUploadDataSource({
  fallbackErrorMessage,
  hasAccessToken,
  loginRequiredMessage,
  onSuccess,
}: UseUploadDataSourceOptions) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: uploadDataSource,
  });

  const upload = useCallback(
    async (file: File) => {
      if (!hasAccessToken) {
        throw new Error(loginRequiredMessage);
      }

      try {
        await mutation.mutateAsync(file);
        await queryClient.invalidateQueries({
          queryKey: dataSourceKeys.lists(),
        });
        onSuccess();
      } catch (error) {
        throw new Error(getApiErrorMessage(error, fallbackErrorMessage));
      }
    },
    [
      fallbackErrorMessage,
      hasAccessToken,
      loginRequiredMessage,
      mutation,
      onSuccess,
      queryClient,
    ],
  );

  return {
    isPending: mutation.isPending,
    upload,
  };
}

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getDataSource, deleteDataSource } from '@/apis/dataSourceRepository';
import { dataSourceKeys } from '@/apis/datasource';

type UseDataDetailParams = {
  dataSourceId: number;
  enabled: boolean;
};

export function useDataDetail({ dataSourceId, enabled }: UseDataDetailParams) {
  const queryClient = useQueryClient();
  const detailQuery = useQuery({
    queryKey: dataSourceKeys.detail(dataSourceId),
    queryFn: () => getDataSource(dataSourceId),
    enabled,
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteDataSource(dataSourceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: dataSourceKeys.lists(),
      });
      void queryClient.invalidateQueries({
        queryKey: dataSourceKeys.detail(dataSourceId),
      });
    },
  });

  return {
    detail: detailQuery.data,
    deleteDataSource: deleteMutation.mutateAsync,
    deletePending: deleteMutation.isPending,
    isError: detailQuery.isError,
    isLoading: detailQuery.isLoading,
  };
}

'use client';

import { useCallback, useState } from 'react';
import type { ToastTone } from '@/hooks/useToast';
import type { MockDataSourceManager } from '@/features/mockDataSource';
import { useDeleteDataSources } from './useDeleteDataSources';

type UseDataSourceDeleteFlowOptions = {
  conflictErrorMessage: string;
  fallbackErrorMessage: string;
  mockDataSource: Pick<
    MockDataSourceManager,
    'canPersistDeletedDataSources' | 'markDeletedDataSources'
  >;
  onDeleted?: () => void;
  showToast: (message: string, tone?: ToastTone) => void;
  successMessage?: string;
};

export function useDataSourceDeleteFlow({
  conflictErrorMessage,
  fallbackErrorMessage,
  mockDataSource,
  onDeleted,
  showToast,
  successMessage,
}: UseDataSourceDeleteFlowOptions) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteDataSourcesMutation = useDeleteDataSources({
    conflictErrorMessage,
    fallbackErrorMessage,
    mockDataSource,
    onError: (message) => {
      setDeleteOpen(false);
      showToast(message, 'error');
    },
    onSuccess: () => {
      setDeleteOpen(false);
      onDeleted?.();

      if (successMessage) {
        showToast(successMessage, 'success');
      }
    },
  });

  const openDelete = useCallback(() => {
    setDeleteOpen(true);
  }, []);

  const closeDelete = useCallback(() => {
    setDeleteOpen(false);
  }, []);

  const confirmDelete = useCallback(
    async (dataSourceIds: number[]) => {
      await deleteDataSourcesMutation.remove(dataSourceIds);
    },
    [deleteDataSourcesMutation],
  );

  return {
    closeDelete,
    confirmDelete,
    deleteOpen,
    deletePending: deleteDataSourcesMutation.isPending,
    openDelete,
  };
}

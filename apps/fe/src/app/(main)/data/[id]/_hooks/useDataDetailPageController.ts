'use client';

import { useRouter } from 'next/navigation';
import { DATA_SOURCE_MESSAGES } from '@/constants/messages';
import type { GetFileResponse } from '@/features/dataSource';
import { useDataSourceDetail } from '@/features/dataSource/hooks/useDataSourceDetail';
import { useDataSourceDeleteFlow } from '@/features/dataSource/hooks/useDataSourceDeleteFlow';
import { useDataSourceUserContext } from '@/features/dataSource/hooks/useDataSourceUserContext';
import { useToast, type ToastState } from '@/hooks/useToast';

type DataDetailStatusController = {
  message: string;
  status: 'status';
};

type DataDetailReadyController = {
  deleteOpen: boolean;
  deletePending: boolean;
  detail: GetFileResponse;
  onChat: () => void;
  onDelete: () => void;
  onDeleteClose: () => void;
  onDeleteConfirm: () => void;
  status: 'ready';
  toast: ToastState | null;
};

export type DataDetailPageController =
  | DataDetailReadyController
  | DataDetailStatusController;

export function useDataDetailPageController(
  id: string,
): DataDetailPageController {
  const router = useRouter();
  const { hasAccessToken, isAuthenticated, mockDataSource, status } =
    useDataSourceUserContext();
  const { toast, showToast } = useToast();

  const dataSourceId = Number(id);
  const isValidDataSourceId =
    Number.isSafeInteger(dataSourceId) && dataSourceId > 0;
  const dataSourceDetailId = isValidDataSourceId ? dataSourceId : null;
  const isDeletedMockDataSource =
    mockDataSource.isDeletedDataSource(dataSourceId);

  const detailQuery = useDataSourceDetail(dataSourceDetailId, {
    enabled: isAuthenticated && !isDeletedMockDataSource,
  });
  const deleteFlow = useDataSourceDeleteFlow({
    conflictErrorMessage: DATA_SOURCE_MESSAGES.deleteConflict,
    fallbackErrorMessage: DATA_SOURCE_MESSAGES.detailDeleteError,
    mockDataSource,
    onDeleted: () => router.push('/data'),
    showToast,
  });

  const handleDeleteConfirm = async () => {
    if (dataSourceDetailId === null) return;

    await deleteFlow.confirmDelete([dataSourceDetailId]);
  };

  if (!isValidDataSourceId) {
    return {
      message: DATA_SOURCE_MESSAGES.detailInvalid,
      status: 'status',
    };
  }

  if (status === 'initializing') {
    return {
      message: DATA_SOURCE_MESSAGES.detailLoading,
      status: 'status',
    };
  }

  if (!hasAccessToken) {
    return {
      message: DATA_SOURCE_MESSAGES.detailLoginRequired,
      status: 'status',
    };
  }

  if (detailQuery.isLoading) {
    return {
      message: DATA_SOURCE_MESSAGES.detailLoading,
      status: 'status',
    };
  }

  if (isDeletedMockDataSource || detailQuery.isError || !detailQuery.data) {
    return {
      message: DATA_SOURCE_MESSAGES.detailLoadFailed,
      status: 'status',
    };
  }

  return {
    deleteOpen: deleteFlow.deleteOpen,
    deletePending: deleteFlow.deletePending,
    detail: detailQuery.data,
    onChat: () => router.push(`/analysis/${id}`),
    onDelete: deleteFlow.openDelete,
    onDeleteClose: deleteFlow.closeDelete,
    onDeleteConfirm: () => void handleDeleteConfirm(),
    status: 'ready',
    toast,
  };
}

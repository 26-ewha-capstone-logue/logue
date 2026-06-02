'use client';

import { useCallback } from 'react';
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

type DataDetailStatusParams = {
  detailQuery: ReturnType<typeof useDataSourceDetail>;
  hasAccessToken: boolean;
  isDeletedMockDataSource: boolean;
  isValidDataSourceId: boolean;
  status: ReturnType<typeof useDataSourceUserContext>['status'];
};

type DataDetailActionsParams = {
  dataSourceDetailId: number | null;
  mockDataSource: ReturnType<typeof useDataSourceUserContext>['mockDataSource'];
  showToast: ReturnType<typeof useToast>['showToast'];
};

function getDataDetailStatusMessage({
  detailQuery,
  hasAccessToken,
  isDeletedMockDataSource,
  isValidDataSourceId,
  status,
}: DataDetailStatusParams) {
  if (!isValidDataSourceId) {
    return DATA_SOURCE_MESSAGES.detailInvalid;
  }

  if (status === 'initializing') {
    return DATA_SOURCE_MESSAGES.detailLoading;
  }

  if (!hasAccessToken) {
    return DATA_SOURCE_MESSAGES.detailLoginRequired;
  }

  if (detailQuery.isLoading) {
    return DATA_SOURCE_MESSAGES.detailLoading;
  }

  if (isDeletedMockDataSource || detailQuery.isError || !detailQuery.data) {
    return DATA_SOURCE_MESSAGES.detailLoadFailed;
  }

  return null;
}

function useDataDetailActions({
  dataSourceDetailId,
  mockDataSource,
  showToast,
}: DataDetailActionsParams) {
  const router = useRouter();
  const deleteFlow = useDataSourceDeleteFlow({
    conflictErrorMessage: DATA_SOURCE_MESSAGES.deleteConflict,
    fallbackErrorMessage: DATA_SOURCE_MESSAGES.detailDeleteError,
    mockDataSource,
    onDeleted: () => router.push('/data'),
    showToast,
  });
  const handleDeleteConfirm = useCallback(async () => {
    if (dataSourceDetailId === null) return;

    await deleteFlow.confirmDelete([dataSourceDetailId]);
  }, [dataSourceDetailId, deleteFlow]);
  const handleChat = useCallback(() => {
    if (dataSourceDetailId === null) return;

    router.push(`/analysis/${dataSourceDetailId}`);
  }, [dataSourceDetailId, router]);

  return {
    deleteOpen: deleteFlow.deleteOpen,
    deletePending: deleteFlow.deletePending,
    onChat: handleChat,
    onDelete: deleteFlow.openDelete,
    onDeleteClose: deleteFlow.closeDelete,
    onDeleteConfirm: () => void handleDeleteConfirm(),
  };
}

export function useDataDetailPageController(
  id: string,
): DataDetailPageController {
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
  const actions = useDataDetailActions({
    dataSourceDetailId,
    mockDataSource,
    showToast,
  });
  const statusMessage = getDataDetailStatusMessage({
    detailQuery,
    hasAccessToken,
    isDeletedMockDataSource,
    isValidDataSourceId,
    status,
  });

  if (statusMessage) {
    return {
      message: statusMessage,
      status: 'status',
    };
  }

  const detail = detailQuery.data;
  if (!detail) {
    return {
      message: DATA_SOURCE_MESSAGES.detailLoadFailed,
      status: 'status',
    };
  }

  return {
    ...actions,
    detail,
    status: 'ready',
    toast,
  };
}

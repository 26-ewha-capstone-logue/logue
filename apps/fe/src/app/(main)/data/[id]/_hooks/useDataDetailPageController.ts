'use client';

import { useRouter } from 'next/navigation';
import { DATA_SOURCE_MESSAGES } from '@/constants/messages';
import type { GetFileResponse } from '@/features/dataSource';
import { useDataSourceDetail } from '@/features/dataSource/hooks/useDataSourceDetail';
import { useDataSourceDeleteFlow } from '@/features/dataSource/hooks/useDataSourceDeleteFlow';
import { useDataSourceUserContext } from '@/features/dataSource/hooks/useDataSourceUserContext';
import { useToast, type ToastState } from '@/hooks/useToast';

const INVALID_DATA_SOURCE_MESSAGE =
  '\uC62C\uBC14\uB974\uC9C0 \uC54A\uC740 \uB370\uC774\uD130 \uC18C\uC2A4\uC785\uB2C8\uB2E4.';
const DATA_SOURCE_LOADING_MESSAGE =
  '\uB370\uC774\uD130 \uC18C\uC2A4\uB97C \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4.';
const DATA_SOURCE_LOGIN_REQUIRED_MESSAGE =
  '\uB85C\uADF8\uC778 \uD6C4 \uB370\uC774\uD130 \uC18C\uC2A4\uB97C \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.';
const DATA_SOURCE_LOAD_FAILED_MESSAGE =
  '\uB370\uC774\uD130 \uC18C\uC2A4\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.';

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
      message: INVALID_DATA_SOURCE_MESSAGE,
      status: 'status',
    };
  }

  if (status === 'initializing') {
    return {
      message: DATA_SOURCE_LOADING_MESSAGE,
      status: 'status',
    };
  }

  if (!hasAccessToken) {
    return {
      message: DATA_SOURCE_LOGIN_REQUIRED_MESSAGE,
      status: 'status',
    };
  }

  if (detailQuery.isLoading) {
    return {
      message: DATA_SOURCE_LOADING_MESSAGE,
      status: 'status',
    };
  }

  if (isDeletedMockDataSource || detailQuery.isError || !detailQuery.data) {
    return {
      message: DATA_SOURCE_LOAD_FAILED_MESSAGE,
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

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AUTH_MESSAGES, DATA_SOURCE_MESSAGES } from '@/constants/messages';
import type { DataSourceSort, DataSourceSummary } from '@/features/dataSource';
import { useDataSourceList } from '@/features/dataSource/hooks/useDataSourceList';
import { useDataSourceSelection } from '@/features/dataSource/hooks/useDataSourceSelection';
import { useDataSourceUserContext } from '@/features/dataSource/hooks/useDataSourceUserContext';
import { useDataSourceDeleteFlow } from '@/features/dataSource/hooks/useDataSourceDeleteFlow';
import { useUploadDataSource } from '@/features/dataSource/hooks/useUploadDataSource';
import { getTableMessage } from '@/features/dataSource/utils/tableMessage';
import { useStartAnalysis } from '@/hooks/useStartAnalysis';
import { useToast } from '@/hooks/useToast';
import { validateCsvFile } from '@/lib/fileValidation';

const SORT_OPTIONS = [
  { value: 'MOST_USED', label: '사용량 많은 순' },
  { value: 'LATEST', label: '최근 업로드 순' },
] satisfies Array<{ value: DataSourceSort; label: string }>;

export function useDataPageController() {
  const router = useRouter();
  const { hasAccessToken, isAuthenticated, mockDataSource, status } =
    useDataSourceUserContext();
  const { toast, showToast } = useToast();
  const [sortKey, setSortKey] = useState<DataSourceSort>('LATEST');
  const [page, setPage] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const startAnalysis = useStartAnalysis({
    loginRequiredMessage: AUTH_MESSAGES.loginRequired,
    fallbackErrorMessage: DATA_SOURCE_MESSAGES.startChatError,
    onError: (message) => showToast(message, 'error'),
  });

  const dataSourcesQuery = useDataSourceList({
    enabled: isAuthenticated,
    fallbackErrorMessage: DATA_SOURCE_MESSAGES.listError,
    mockDataSource,
    page,
    sort: sortKey,
  });
  const dataSources = dataSourcesQuery.dataSources;
  const {
    allSelected,
    clearSelection,
    hasSelection,
    partiallySelected,
    selectedVisibleIds,
    toggleAll,
    toggleOne,
  } = useDataSourceSelection(dataSources);
  const uploadDataSourceMutation = useUploadDataSource({
    fallbackErrorMessage: DATA_SOURCE_MESSAGES.uploadError,
    hasAccessToken,
    loginRequiredMessage: AUTH_MESSAGES.loginRequired,
    onSuccess: () => {
      clearSelection();
      setUploadOpen(false);
      showToast(DATA_SOURCE_MESSAGES.uploadSuccess, 'success');
    },
  });
  const deleteFlow = useDataSourceDeleteFlow({
    conflictErrorMessage: DATA_SOURCE_MESSAGES.deleteConflict,
    fallbackErrorMessage: DATA_SOURCE_MESSAGES.deleteError,
    mockDataSource,
    onDeleted: clearSelection,
    showToast,
    successMessage: DATA_SOURCE_MESSAGES.deleteSuccess,
  });

  const handleSortChange = (next: DataSourceSort) => {
    setSortKey(next);
    setPage(0);
    clearSelection();
  };

  const handleUploadClick = () => {
    if (!hasAccessToken) {
      showToast(AUTH_MESSAGES.loginRequired, 'error');
      return;
    }

    setUploadOpen(true);
  };

  const handleDeleteClick = () => {
    if (!hasSelection) return;
    deleteFlow.openDelete();
  };

  const handleDeleteConfirm = async () => {
    await deleteFlow.confirmDelete(Array.from(selectedVisibleIds));
  };

  const handleChat = (dataSource: DataSourceSummary) => {
    if (!hasAccessToken) {
      showToast(AUTH_MESSAGES.loginRequired, 'error');
      return;
    }

    startAnalysis.startAnalysis({
      type: 'dataSource',
      dataSourceId: dataSource.dataSourceId,
      fileName: dataSource.fileName,
    });
  };

  const tableMessage = getTableMessage({
    dataSourceCount: dataSources.length,
    emptyMessage: DATA_SOURCE_MESSAGES.tableEmpty,
    errorMessage: dataSourcesQuery.errorMessage,
    hasAccessToken,
    isError: dataSourcesQuery.isError,
    isLoading: dataSourcesQuery.isLoading,
    loadingMessage: DATA_SOURCE_MESSAGES.tableLoading,
    loginRequiredMessage: AUTH_MESSAGES.loginRequired,
    status,
  });

  return {
    deleteModal: {
      isPending: deleteFlow.deletePending,
      onClose: deleteFlow.closeDelete,
      onConfirm: () => void handleDeleteConfirm(),
      open: deleteFlow.deleteOpen,
    },
    table: {
      allSelected,
      chatDisabled: startAnalysis.isPending,
      chatPendingDataSourceId: startAnalysis.pendingDataSourceId,
      dataSources,
      partiallySelected,
      selectedVisibleIds,
      tableMessage,
      onChat: handleChat,
      onOpenDetail: (id: number) => router.push(`/data/${id}`),
      onToggleAll: toggleAll,
      onToggleOne: toggleOne,
    },
    toast,
    toolbar: {
      deletePending: deleteFlow.deletePending,
      hasSelection,
      sortKey,
      sortOptions: SORT_OPTIONS,
      uploadPending: uploadDataSourceMutation.isPending,
      onDeleteClick: handleDeleteClick,
      onSortChange: handleSortChange,
      onUploadClick: handleUploadClick,
    },
    uploadModal: {
      onClose: () => setUploadOpen(false),
      onError: (message: string) => showToast(message, 'error'),
      onUpload: uploadDataSourceMutation.upload,
      open: uploadOpen,
      validateFile: (file: File) =>
        validateCsvFile(file, DATA_SOURCE_MESSAGES.fileValidation),
    },
  };
}

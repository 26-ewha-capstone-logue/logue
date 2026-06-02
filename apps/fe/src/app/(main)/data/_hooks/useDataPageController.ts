'use client';

import { useCallback, useState } from 'react';
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

type DataSourceActionsParams = {
  clearSelection: () => void;
  hasAccessToken: boolean;
  hasSelection: boolean;
  mockDataSource: ReturnType<typeof useDataSourceUserContext>['mockDataSource'];
  selectedVisibleIds: ReadonlySet<number>;
  showToast: ReturnType<typeof useToast>['showToast'];
};

function useDataSourceTableState() {
  const [sortKey, setSortKey] = useState<DataSourceSort>('LATEST');
  const [page, setPage] = useState(0);

  const changeSort = useCallback(
    (next: DataSourceSort, afterChange: () => void) => {
      setSortKey(next);
      setPage(0);
      afterChange();
    },
    [],
  );
  const changePage = useCallback((next: number, afterChange: () => void) => {
    setPage(next);
    afterChange();
  }, []);

  return {
    changePage,
    changeSort,
    page,
    sortKey,
    sortOptions: SORT_OPTIONS,
  };
}

function useDataSourceActions({
  clearSelection,
  hasAccessToken,
  hasSelection,
  mockDataSource,
  selectedVisibleIds,
  showToast,
}: DataSourceActionsParams) {
  const router = useRouter();
  const [uploadOpen, setUploadOpen] = useState(false);
  const startAnalysis = useStartAnalysis({
    loginRequiredMessage: AUTH_MESSAGES.loginRequired,
    fallbackErrorMessage: DATA_SOURCE_MESSAGES.startChatError,
    onError: (message) => showToast(message, 'error'),
  });
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

  const handleUploadClick = useCallback(() => {
    if (!hasAccessToken) {
      showToast(AUTH_MESSAGES.loginRequired, 'error');
      return;
    }

    setUploadOpen(true);
  }, [hasAccessToken, showToast]);
  const handleDeleteClick = useCallback(() => {
    if (!hasSelection) return;

    deleteFlow.openDelete();
  }, [deleteFlow, hasSelection]);
  const handleDeleteConfirm = useCallback(async () => {
    await deleteFlow.confirmDelete(Array.from(selectedVisibleIds));
  }, [deleteFlow, selectedVisibleIds]);
  const handleChat = useCallback(
    (dataSource: DataSourceSummary) => {
      if (!hasAccessToken) {
        showToast(AUTH_MESSAGES.loginRequired, 'error');
        return;
      }

      startAnalysis.startAnalysis({
        type: 'dataSource',
        dataSourceId: dataSource.dataSourceId,
        fileName: dataSource.fileName,
      });
    },
    [hasAccessToken, showToast, startAnalysis],
  );

  return {
    deleteModal: {
      isPending: deleteFlow.deletePending,
      onClose: deleteFlow.closeDelete,
      onConfirm: () => void handleDeleteConfirm(),
      open: deleteFlow.deleteOpen,
    },
    tableActions: {
      chatDisabled: startAnalysis.isPending,
      chatPendingDataSourceId: startAnalysis.pendingDataSourceId,
      onChat: handleChat,
      onOpenDetail: (id: number) => router.push(`/data/${id}`),
    },
    toolbarActions: {
      deletePending: deleteFlow.deletePending,
      onDeleteClick: handleDeleteClick,
      onUploadClick: handleUploadClick,
      uploadPending: uploadDataSourceMutation.isPending,
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

export function useDataPageController() {
  const { hasAccessToken, isAuthenticated, mockDataSource, status } =
    useDataSourceUserContext();
  const { toast, showToast } = useToast();
  const { changePage, changeSort, page, sortKey, sortOptions } =
    useDataSourceTableState();

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
  const actions = useDataSourceActions({
    clearSelection,
    hasAccessToken,
    hasSelection,
    mockDataSource,
    selectedVisibleIds,
    showToast,
  });
  const handleSortChange = useCallback(
    (next: DataSourceSort) => {
      changeSort(next, clearSelection);
    },
    [changeSort, clearSelection],
  );
  const handlePageChange = useCallback(
    (next: number) => {
      changePage(next, clearSelection);
    },
    [changePage, clearSelection],
  );
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
    deleteModal: actions.deleteModal,
    table: {
      allSelected,
      dataSources,
      page,
      partiallySelected,
      selectedVisibleIds,
      tableMessage,
      totalPages: dataSourcesQuery.totalPages,
      onPageChange: handlePageChange,
      onToggleAll: toggleAll,
      onToggleOne: toggleOne,
      ...actions.tableActions,
    },
    toast,
    toolbar: {
      hasSelection,
      sortKey,
      sortOptions,
      onSortChange: handleSortChange,
      ...actions.toolbarActions,
    },
    uploadModal: actions.uploadModal,
  };
}

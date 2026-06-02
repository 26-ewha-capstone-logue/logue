'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmModal, FileUploadModal, ToastPortal } from '@/components';
import { AUTH_MESSAGES, DATA_SOURCE_MESSAGES } from '@/constants/messages';
import type { DataSourceSummary, DataSourceSort } from '@/features/dataSource';
import { useStartAnalysis } from '@/hooks/useStartAnalysis';
import { useToast } from '@/hooks/useToast';
import { validateCsvFile } from '@/lib/fileValidation';
import DataSourceTable from './_components/DataSourceTable';
import DataSourceToolbar from './_components/DataSourceToolbar';
import { useDataSourceList } from './_hooks/useDataSourceList';
import { useDataSourceSelection } from './_hooks/useDataSourceSelection';
import { useDataSourceUserContext } from './_hooks/useDataSourceUserContext';
import { useDeleteDataSources } from './_hooks/useDeleteDataSources';
import { useUploadDataSource } from './_hooks/useUploadDataSource';
import { getTableMessage } from './_utils/tableMessage';

const DELETE_ILLUST_SRC = '/illusts/delete.svg';

const SORT_OPTIONS = [
  { value: 'MOST_USED', label: '사용량 많은 순' },
  { value: 'LATEST', label: '최근 업로드 순' },
] satisfies Array<{ value: DataSourceSort; label: string }>;

export default function DataPage() {
  const router = useRouter();
  const { hasAccessToken, isAuthenticated, mockDataSource, status } =
    useDataSourceUserContext();
  const { toast, showToast } = useToast();
  const [sortKey, setSortKey] = useState<DataSourceSort>('LATEST');
  const [page, setPage] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
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
  const deleteDataSourcesMutation = useDeleteDataSources({
    conflictErrorMessage: DATA_SOURCE_MESSAGES.deleteConflict,
    fallbackErrorMessage: DATA_SOURCE_MESSAGES.deleteError,
    mockDataSource,
    onError: (message) => {
      setDeleteOpen(false);
      showToast(message, 'error');
    },
    onSuccess: () => {
      clearSelection();
      setDeleteOpen(false);
      showToast(DATA_SOURCE_MESSAGES.deleteSuccess, 'success');
    },
  });

  const chatPendingDataSourceId = startAnalysis.pendingDataSourceId;
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
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    await deleteDataSourcesMutation.remove(Array.from(selectedVisibleIds));
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

  const goToDetail = (id: number) => {
    router.push(`/data/${id}`);
  };

  return (
    <main className="scrollbar-hide flex min-h-0 flex-1 flex-col overflow-y-auto px-40 pt-32 pb-40">
      <h1 className="mb-24 text-head2 font-semibold text-gray-900">
        데이터 소스
      </h1>

      <DataSourceToolbar
        deletePending={deleteDataSourcesMutation.isPending}
        hasSelection={hasSelection}
        sortKey={sortKey}
        sortOptions={SORT_OPTIONS}
        uploadPending={uploadDataSourceMutation.isPending}
        onDeleteClick={handleDeleteClick}
        onSortChange={handleSortChange}
        onUploadClick={handleUploadClick}
      />

      <DataSourceTable
        allSelected={allSelected}
        chatDisabled={startAnalysis.isPending}
        chatPendingDataSourceId={chatPendingDataSourceId}
        dataSources={dataSources}
        partiallySelected={partiallySelected}
        selectedVisibleIds={selectedVisibleIds}
        tableMessage={tableMessage}
        onChat={handleChat}
        onOpenDetail={goToDetail}
        onToggleAll={toggleAll}
        onToggleOne={toggleOne}
      />

      <FileUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        validateFile={(file) =>
          validateCsvFile(file, DATA_SOURCE_MESSAGES.fileValidation)
        }
        onError={(message) => showToast(message, 'error')}
        onUpload={uploadDataSourceMutation.upload}
      />

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => void handleDeleteConfirm()}
        title={DATA_SOURCE_MESSAGES.deleteTitle}
        description={DATA_SOURCE_MESSAGES.deleteDescription}
        confirmLabel={DATA_SOURCE_MESSAGES.deleteConfirmLabel}
        cancelLabel={DATA_SOURCE_MESSAGES.deleteCancelLabel}
        confirmDisabled={deleteDataSourcesMutation.isPending}
        icon={
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={DELETE_ILLUST_SRC}
              alt=""
              aria-hidden
              className="h-[8rem] w-auto"
            />
          </>
        }
      />

      <ToastPortal toast={toast} />
    </main>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { type DataSourceSummary, type DataSourceSort } from '@/apis/datasource';
import {
  Checkbox,
  ConfirmModal,
  FileUploadModal,
  ToastPortal,
} from '@/components';
import { useStartAnalysis } from '@/hooks/useStartAnalysis';
import { useMyInfo } from '@/hooks/useMyInfo';
import { useToast } from '@/hooks/useToast';
import { validateCsvFile } from '@/lib/fileValidation';
import { useAuthSession } from '@/providers/AuthProvider';
import DataSourceToolbar from './_components/DataSourceToolbar';
import DataSourceRow from './_components/DataSourceRow';
import { useDeletedMockDataSources } from './_hooks/useDeletedMockDataSources';
import { useDataSourceList } from './_hooks/useDataSourceList';
import { useDataSourceSelection } from './_hooks/useDataSourceSelection';
import { useDeleteDataSources } from './_hooks/useDeleteDataSources';
import { useUploadDataSource } from './_hooks/useUploadDataSource';
import { getTableMessage } from './_utils/tableMessage';

const DELETE_ILLUST_SRC = '/illusts/delete.svg';
const LOGIN_REQUIRED_MESSAGE = '로그인이 필요해요. 다시 로그인해 주세요.';
const LIST_ERROR_MESSAGE = '데이터 소스 목록을 불러오지 못했어요.';
const UPLOAD_ERROR_MESSAGE =
  '파일 업로드에 실패했어요. 잠시 후 다시 시도해 주세요.';
const DELETE_ERROR_MESSAGE =
  '파일 삭제에 실패했어요. 잠시 후 다시 시도해 주세요.';
const DELETE_CONFLICT_ERROR_MESSAGE =
  '연결된 분석 채팅이 있어 현재 삭제할 수 없어요. 채팅 삭제 기능이 준비되면 함께 삭제할 수 있습니다.';
const START_CHAT_ERROR_MESSAGE =
  '분석 채팅을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.';

const SORT_OPTIONS = [
  { value: 'MOST_USED', label: '사용량 많은 순' },
  { value: 'LATEST', label: '최근 업로드 순' },
] satisfies Array<{ value: DataSourceSort; label: string }>;

const DATA_FILE_MESSAGES = {
  invalidType: '파일 형식이 맞지 않습니다.',
  empty: '빈 CSV 파일은 업로드할 수 없어요.',
  tooLarge: '파일이 너무 커요. 50MB까지만 업로드 가능해요.',
};

export default function DataPage() {
  const router = useRouter();
  const { hasAccessToken, isAuthenticated, status } = useAuthSession();
  const { data: myInfo } = useMyInfo(isAuthenticated);
  const { deletedMockDataSourceIds, markDeletedMockDataSources } =
    useDeletedMockDataSources(myInfo?.id);
  const { toast, showToast } = useToast();
  const [sortKey, setSortKey] = useState<DataSourceSort>('LATEST');
  const [page, setPage] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const startAnalysis = useStartAnalysis({
    loginRequiredMessage: LOGIN_REQUIRED_MESSAGE,
    fallbackErrorMessage: START_CHAT_ERROR_MESSAGE,
    onError: (message) => showToast(message, 'error'),
  });

  const dataSourcesQuery = useDataSourceList({
    deletedMockDataSourceIds,
    enabled: isAuthenticated,
    fallbackErrorMessage: LIST_ERROR_MESSAGE,
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
    fallbackErrorMessage: UPLOAD_ERROR_MESSAGE,
    hasAccessToken,
    loginRequiredMessage: LOGIN_REQUIRED_MESSAGE,
    onSuccess: () => {
      clearSelection();
      setUploadOpen(false);
      showToast('파일을 업로드했습니다.', 'success');
    },
  });
  const deleteDataSourcesMutation = useDeleteDataSources({
    conflictErrorMessage: DELETE_CONFLICT_ERROR_MESSAGE,
    fallbackErrorMessage: DELETE_ERROR_MESSAGE,
    onDeletedMockDataSources: markDeletedMockDataSources,
    onError: (message) => {
      setDeleteOpen(false);
      showToast(message, 'error');
    },
    onSuccess: () => {
      clearSelection();
      setDeleteOpen(false);
      showToast('파일을 삭제했습니다.', 'success');
    },
    userId: myInfo?.id,
  });

  const chatPendingDataSourceId = startAnalysis.pendingDataSourceId;
  const tableMessage = getTableMessage({
    dataSourceCount: dataSources.length,
    emptyMessage: '업로드된 데이터 소스가 없습니다.',
    errorMessage: dataSourcesQuery.errorMessage,
    hasAccessToken,
    isError: dataSourcesQuery.isError,
    isLoading: dataSourcesQuery.isLoading,
    loadingMessage: '데이터 소스 목록을 불러오는 중이에요.',
    loginRequiredMessage: LOGIN_REQUIRED_MESSAGE,
    status,
  });

  const handleSortChange = (next: DataSourceSort) => {
    setSortKey(next);
    setPage(0);
    clearSelection();
  };

  const handleUploadClick = () => {
    if (!hasAccessToken) {
      showToast(LOGIN_REQUIRED_MESSAGE, 'error');
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
      showToast(LOGIN_REQUIRED_MESSAGE, 'error');
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

      <div className="overflow-hidden rounded-12 border border-gray-300 bg-white">
        <table className="w-full border-collapse text-body4">
          <thead>
            <tr className="bg-gray-200 text-gray-900">
              <th className="w-[5.6rem] py-16 pl-24 text-left">
                <Checkbox
                  size="md"
                  checked={allSelected}
                  indeterminate={partiallySelected}
                  onCheckedChange={toggleAll}
                  aria-label="데이터 소스 전체 선택"
                />
              </th>
              <th className="py-16 text-left font-semibold">파일명</th>
              <th className="w-[14rem] py-16 text-left font-semibold">
                파일 크기
              </th>
              <th className="w-[16rem] py-16 text-left font-semibold">
                최근 업로드
              </th>
              <th className="w-[14rem] py-16 pr-24 text-right font-semibold">
                액션
              </th>
            </tr>
          </thead>
          <tbody>
            {tableMessage ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-24 py-40 text-center text-gray-600"
                >
                  {tableMessage}
                </td>
              </tr>
            ) : (
              dataSources.map((dataSource) => (
                <DataSourceRow
                  key={dataSource.dataSourceId}
                  checked={selectedVisibleIds.has(dataSource.dataSourceId)}
                  chatDisabled={startAnalysis.isPending}
                  chatPending={
                    chatPendingDataSourceId === dataSource.dataSourceId
                  }
                  dataSource={dataSource}
                  onChat={handleChat}
                  onOpenDetail={goToDetail}
                  onToggle={toggleOne}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <FileUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        validateFile={(file) => validateCsvFile(file, DATA_FILE_MESSAGES)}
        onError={(message) => showToast(message, 'error')}
        onUpload={uploadDataSourceMutation.upload}
      />

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => void handleDeleteConfirm()}
        title="파일을 삭제하시겠어요?"
        description="삭제 후엔 복구할 수 없어요."
        confirmLabel="삭제하기"
        cancelLabel="취소하기"
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

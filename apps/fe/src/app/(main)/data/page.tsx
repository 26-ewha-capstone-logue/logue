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
import { useToast } from '@/hooks/useToast';
import { validateCsvFile } from '@/lib/fileValidation';
import { useAuthSession } from '@/providers/AuthProvider';
import DataSourceRow from './_components/DataSourceRow';
import SortDropdown from './_components/SortDropdown';
import { useDataSourceList } from './_hooks/useDataSourceList';
import { useDeleteDataSources } from './_hooks/useDeleteDataSources';
import { useUploadDataSource } from './_hooks/useUploadDataSource';

const DELETE_ILLUST_SRC = '/illusts/delete.svg';
const LOGIN_REQUIRED_MESSAGE = '로그인이 필요해요. 다시 로그인해 주세요.';
const LIST_ERROR_MESSAGE = '데이터 소스 목록을 불러오지 못했어요.';
const UPLOAD_ERROR_MESSAGE =
  '파일 업로드에 실패했어요. 잠시 후 다시 시도해 주세요.';
const DELETE_ERROR_MESSAGE =
  '파일 삭제에 실패했어요. 잠시 후 다시 시도해 주세요.';
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
  const { hasAccessToken } = useAuthSession();
  const { toast, showToast } = useToast();
  const [sortKey, setSortKey] = useState<DataSourceSort>('LATEST');
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const startAnalysis = useStartAnalysis({
    loginRequiredMessage: LOGIN_REQUIRED_MESSAGE,
    fallbackErrorMessage: START_CHAT_ERROR_MESSAGE,
    onError: (message) => showToast(message, 'error'),
  });

  const dataSourcesQuery = useDataSourceList({
    enabled: hasAccessToken,
    fallbackErrorMessage: LIST_ERROR_MESSAGE,
    page,
    sort: sortKey,
  });
  const uploadDataSourceMutation = useUploadDataSource({
    fallbackErrorMessage: UPLOAD_ERROR_MESSAGE,
    hasAccessToken,
    loginRequiredMessage: LOGIN_REQUIRED_MESSAGE,
    onSuccess: () => {
      setSelectedIds(new Set());
      setUploadOpen(false);
      showToast('파일을 업로드했습니다.', 'success');
    },
  });
  const deleteDataSourcesMutation = useDeleteDataSources({
    fallbackErrorMessage: DELETE_ERROR_MESSAGE,
    onError: (message) => {
      setDeleteOpen(false);
      showToast(message, 'error');
    },
    onSuccess: () => {
      setSelectedIds(new Set());
      setDeleteOpen(false);
      showToast('파일을 삭제했습니다.', 'success');
    },
  });

  const dataSources = dataSourcesQuery.dataSources;
  const chatPendingDataSourceId = startAnalysis.pendingDataSourceId;
  const allSelected =
    dataSources.length > 0 &&
    dataSources.every((dataSource) => selectedIds.has(dataSource.dataSourceId));
  const partiallySelected = !allSelected && selectedIds.size > 0;
  const hasSelection = selectedIds.size > 0;
  const tableMessage = !hasAccessToken
    ? LOGIN_REQUIRED_MESSAGE
    : dataSourcesQuery.isLoading
      ? '데이터 소스 목록을 불러오는 중이에요.'
      : dataSourcesQuery.isError
        ? dataSourcesQuery.errorMessage
        : dataSources.length === 0
          ? '업로드된 데이터 소스가 없습니다.'
          : null;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(
        new Set(dataSources.map((dataSource) => dataSource.dataSourceId)),
      );
    }
  };

  const toggleOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSortChange = (next: DataSourceSort) => {
    setSortKey(next);
    setPage(0);
    setSelectedIds(new Set());
  };

  const handleUploadClick = () => {
    if (!hasAccessToken) {
      showToast(LOGIN_REQUIRED_MESSAGE, 'error');
      return;
    }

    setUploadOpen(true);
  };

  const handleDeleteClick = () => {
    if (selectedIds.size === 0) return;
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    await deleteDataSourcesMutation.remove(Array.from(selectedIds));
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

      <div className="mb-16 flex items-center justify-between">
        <SortDropdown
          options={SORT_OPTIONS}
          value={sortKey}
          onChange={handleSortChange}
        />
        <div className="flex items-center gap-16">
          {hasSelection && (
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={deleteDataSourcesMutation.isPending}
              className="text-body4 text-gray-700 underline underline-offset-2 hover:text-gray-900 disabled:cursor-not-allowed disabled:text-gray-400"
            >
              삭제하기
            </button>
          )}
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={uploadDataSourceMutation.isPending}
            className="rounded-full bg-orange-500 px-16 py-8 text-body4 font-medium text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            CSV 파일 업로드
          </button>
        </div>
      </div>

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
                  checked={selectedIds.has(dataSource.dataSourceId)}
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

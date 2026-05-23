'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { startAnalysisFlowFromDataSource } from '@/apis/analysis';
import {
  dataSourceQueryKeys,
  deleteDataSources,
  getDataSources,
  uploadDataSource,
  type DataSourceSummary,
  type DataSourceSort,
} from '@/apis/dataSource';
import { getApiErrorMessage } from '@/apis/errors';
import ChatIcon from '@/assets/icons/chat.svg';
import SuccessIcon from '@/assets/icons/success.svg';
import { FileUploadModal, Modal, ToastAlert } from '@/components';
import { writeAnalysisStartPayload } from '@/lib/analysisStartPayload';
import { formatFileSize, validateCsvFile } from '@/lib/fileValidation';
import { useAuthSession } from '@/providers/AuthProvider';
import Checkbox from './_components/Checkbox';
import SortDropdown from './_components/SortDropdown';

const DELETE_ILLUST_SRC = '/illusts/delete.svg';
const TOAST_DURATION_MS = 2500;
const DATA_SOURCE_PAGE_SIZE = 20;
const LOGIN_REQUIRED_MESSAGE = '로그인이 필요해요. 다시 로그인해 주세요.';
const LIST_ERROR_MESSAGE = '데이터 소스 목록을 불러오지 못했어요.';
const UPLOAD_ERROR_MESSAGE =
  '파일 업로드에 실패했어요. 잠시 후 다시 시도해 주세요.';
const DELETE_ERROR_MESSAGE =
  '파일 삭제에 실패했어요. 잠시 후 다시 시도해 주세요.';
const START_CHAT_ERROR_MESSAGE =
  '분석 채팅을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.';

type ToastState = {
  message: string;
  tone: 'error' | 'success';
};

const SORT_OPTIONS = [
  { value: 'MOST_USED', label: '사용량 많은 순' },
  { value: 'LATEST', label: '최근 업로드 순' },
] satisfies Array<{ value: DataSourceSort; label: string }>;

const DATA_FILE_MESSAGES = {
  invalidType: '파일 형식이 맞지 않습니다.',
  tooLarge: '파일이 너무 커요. 50MB까지만 업로드 가능해요.',
};

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Seoul',
});

function formatUploadedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return DATE_TIME_FORMATTER.format(date);
}

export default function DataPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasAccessToken } = useAuthSession();
  const [sortKey, setSortKey] = useState<DataSourceSort>('LATEST');
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const listParams = useMemo(
    () => ({ sort: sortKey, page, size: DATA_SOURCE_PAGE_SIZE }),
    [page, sortKey],
  );

  const dataSourcesQuery = useQuery({
    queryKey: dataSourceQueryKeys.list(listParams),
    queryFn: () => getDataSources(listParams),
    enabled: hasAccessToken,
  });

  const uploadMutation = useMutation({
    mutationFn: uploadDataSource,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDataSources,
  });

  const startChatMutation = useMutation({
    mutationFn: startAnalysisFlowFromDataSource,
  });

  const dataSources = dataSourcesQuery.data?.dataSources ?? [];
  const chatPendingDataSourceId =
    startChatMutation.isPending &&
    typeof startChatMutation.variables === 'number'
      ? startChatMutation.variables
      : null;
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
        ? getApiErrorMessage(dataSourcesQuery.error, LIST_ERROR_MESSAGE)
        : dataSources.length === 0
          ? '업로드된 데이터 소스가 없습니다.'
          : null;

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = (message: string, tone: ToastState['tone']) => {
    setToast({ message, tone });
  };

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

  const handleUploaded = async (uploaded: File) => {
    if (!hasAccessToken) {
      throw new Error(LOGIN_REQUIRED_MESSAGE);
    }

    try {
      await uploadMutation.mutateAsync(uploaded);
      await queryClient.invalidateQueries({
        queryKey: dataSourceQueryKeys.lists(),
      });
      setSelectedIds(new Set());
      setUploadOpen(false);
      showToast('파일을 업로드했습니다.', 'success');
    } catch (error) {
      throw new Error(getApiErrorMessage(error, UPLOAD_ERROR_MESSAGE));
    }
  };

  const handleDeleteClick = () => {
    if (selectedIds.size === 0) return;
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedIds.size === 0) return;

    try {
      await deleteMutation.mutateAsync(Array.from(selectedIds));
      await queryClient.invalidateQueries({
        queryKey: dataSourceQueryKeys.lists(),
      });
      setSelectedIds(new Set());
      setDeleteOpen(false);
      showToast('파일을 삭제했습니다.', 'success');
    } catch (error) {
      setDeleteOpen(false);
      showToast(getApiErrorMessage(error, DELETE_ERROR_MESSAGE), 'error');
    }
  };

  const handleChat = (dataSource: DataSourceSummary) => {
    if (!hasAccessToken) {
      showToast(LOGIN_REQUIRED_MESSAGE, 'error');
      return;
    }

    startChatMutation.mutate(dataSource.dataSourceId, {
      onSuccess: ({ conversationId, analysisFlowId, dataSourceId }) => {
        writeAnalysisStartPayload(conversationId, {
          fileName: dataSource.fileName,
        });

        const params = new URLSearchParams({
          analysisFlowId: String(analysisFlowId),
          dataSourceId: String(dataSourceId),
        });

        router.push(`/analysis/${conversationId}?${params.toString()}`);
      },
      onError: (error) => {
        showToast(getApiErrorMessage(error, START_CHAT_ERROR_MESSAGE), 'error');
      },
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
              disabled={deleteMutation.isPending}
              className="text-body4 text-gray-700 underline underline-offset-2 hover:text-gray-900 disabled:cursor-not-allowed disabled:text-gray-400"
            >
              삭제하기
            </button>
          )}
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={uploadMutation.isPending}
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
                  checked={allSelected}
                  indeterminate={partiallySelected}
                  onChange={toggleAll}
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
              dataSources.map((row) => {
                const checked = selectedIds.has(row.dataSourceId);
                const isChatPending =
                  chatPendingDataSourceId === row.dataSourceId;
                return (
                  <tr
                    key={row.dataSourceId}
                    className="border-t border-gray-200 transition-colors hover:bg-gray-100"
                  >
                    <td
                      className="py-16 pl-24"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={checked}
                        onChange={() => toggleOne(row.dataSourceId)}
                      />
                    </td>
                    <td className="py-16 text-gray-900">
                      <button
                        type="button"
                        onClick={() => goToDetail(row.dataSourceId)}
                        aria-label={`${row.fileName} 데이터 소스 상세 보기`}
                        className="text-left transition-colors hover:text-orange-600 hover:underline focus-visible:rounded-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                      >
                        {row.fileName}
                      </button>
                    </td>
                    <td className="py-16 text-gray-800">
                      {formatFileSize(row.fileSize)}
                    </td>
                    <td className="py-16 text-gray-800">
                      {formatUploadedAt(row.uploadedAt)}
                    </td>
                    <td
                      className="py-16 pr-24 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleChat(row)}
                        disabled={startChatMutation.isPending}
                        aria-label={`${row.fileName} 분석 채팅 시작`}
                        className="inline-flex items-center gap-4 rounded-full border border-gray-300 bg-white px-12 py-6 text-body4 text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        <ChatIcon
                          aria-hidden
                          className="icon-12 text-orange-500"
                        />
                        <span>{isChatPending ? '시작 중' : '채팅'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <FileUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        validateFile={(file) => validateCsvFile(file, DATA_FILE_MESSAGES)}
        onError={(message) => showToast(message, 'error')}
        onUpload={handleUploaded}
      />

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <div className="flex flex-col items-center gap-24">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={DELETE_ILLUST_SRC}
            alt=""
            aria-hidden
            className="h-[8rem] w-auto"
          />
          <div className="flex flex-col items-center gap-4">
            <h3 className="text-head4 font-semibold text-gray-900">
              파일을 삭제하시겠어요?
            </h3>
            <p className="text-body4 text-gray-700">
              삭제 후에는 복구할 수 없어요.
            </p>
          </div>
          <div className="flex w-full justify-center gap-8">
            <button
              type="button"
              onClick={() => setDeleteOpen(false)}
              className="min-w-[12rem] rounded-full bg-gray-300 px-20 py-12 text-body2 font-medium text-gray-700 transition-colors hover:bg-gray-400"
            >
              취소하기
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteConfirm()}
              disabled={deleteMutation.isPending}
              className="min-w-[12rem] rounded-full bg-orange-500 px-20 py-12 text-body2 font-medium text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              삭제하기
            </button>
          </div>
        </div>
      </Modal>

      {toast && (
        <div className="pointer-events-none fixed bottom-[4.4rem] left-1/2 z-[60] -translate-x-1/2">
          <ToastAlert
            role={toast.tone === 'error' ? 'alert' : 'status'}
            icon={
              toast.tone === 'success' ? (
                <SuccessIcon aria-hidden className="icon-24" />
              ) : undefined
            }
          >
            {toast.message}
          </ToastAlert>
        </div>
      )}
    </main>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  dataSourceKeys,
  deleteDataSources,
  getDataSources,
  uploadDataSource,
  type DataSourceSort,
} from '@/apis/datasource';
import ChatIcon from '@/assets/icons/chat.svg';
import SuccessIcon from '@/assets/icons/success.svg';
import { FileUploadModal, Modal, ToastAlert } from '@/components';
import { formatDateTime } from '@/lib/dateTime';
import { formatFileSize, validateCsvFile } from '@/lib/fileValidation';
import { useAuthSession } from '@/providers/AuthProvider';
import Checkbox from './_components/Checkbox';
import SortDropdown from './_components/SortDropdown';

const DELETE_ILLUST_SRC = '/illusts/delete.svg';
const TOAST_DURATION_MS = 2500;
const DATA_SOURCE_PAGE = 0;
const DATA_SOURCE_PAGE_SIZE = 50;

type SortKey = 'usage' | 'latest';
type ToastState = {
  message: string;
  tone: 'error' | 'success';
};

const SORT_OPTIONS = [
  { value: 'usage', label: '사용량 많은 순' },
  { value: 'latest', label: '최근 업로드순' },
];

const SORT_PARAM_BY_KEY: Record<SortKey, DataSourceSort> = {
  usage: 'MOST_USED',
  latest: 'LATEST',
};

const DATA_FILE_MESSAGES = {
  invalidType: '파일 형식이 맞지 않습니다.',
  tooLarge: '파일이 너무 커요. 50MB까지 업로드할 수 있어요.',
};

export default function DataPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasAccessToken } = useAuthSession();
  const [sortKey, setSortKey] = useState<SortKey>('latest');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const listParams = useMemo(
    () => ({
      sort: SORT_PARAM_BY_KEY[sortKey],
      page: DATA_SOURCE_PAGE,
      size: DATA_SOURCE_PAGE_SIZE,
    }),
    [sortKey],
  );

  const {
    data: dataSourceList,
    isError: isListError,
    isLoading: isListLoading,
  } = useQuery({
    queryKey: dataSourceKeys.list(listParams),
    queryFn: () => getDataSources(listParams),
    enabled: hasAccessToken,
  });

  const dataSources = useMemo(
    () => dataSourceList?.dataSources ?? [],
    [dataSourceList?.dataSources],
  );
  const visibleIdSet = useMemo(
    () => new Set(dataSources.map((d) => d.dataSourceId)),
    [dataSources],
  );
  const selectedIdList = useMemo(
    () => [...selectedIds].filter((id) => visibleIdSet.has(id)),
    [selectedIds, visibleIdSet],
  );
  const selectedVisibleIdSet = useMemo(
    () => new Set(selectedIdList),
    [selectedIdList],
  );

  const uploadMutation = useMutation({
    mutationFn: uploadDataSource,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: dataSourceKeys.lists(),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDataSources,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: dataSourceKeys.lists(),
      });
    },
  });

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = (message: string, tone: ToastState['tone']) => {
    setToast({ message, tone });
  };

  const allSelected =
    dataSources.length > 0 &&
    dataSources.every((d) => selectedVisibleIdSet.has(d.dataSourceId));
  const partiallySelected = !allSelected && selectedIdList.length > 0;
  const hasSelection = selectedIdList.length > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(dataSources.map((d) => d.dataSourceId)));
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

  const handleUploadClick = () => {
    setUploadOpen(true);
  };

  const handleUploaded = async (uploaded: File) => {
    try {
      await uploadMutation.mutateAsync(uploaded);
      setUploadOpen(false);
      showToast('파일을 업로드했습니다.', 'success');
    } catch {
      showToast('파일 업로드에 실패했습니다.', 'error');
    }
  };

  const handleDeleteClick = () => {
    if (selectedIds.size === 0) return;
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedIdList.length === 0) return;

    try {
      await deleteMutation.mutateAsync(selectedIdList);
      setSelectedIds(new Set());
      setDeleteOpen(false);
      showToast('파일을 삭제했습니다.', 'success');
    } catch {
      setDeleteOpen(false);
      showToast('파일 삭제에 실패했습니다.', 'error');
    }
  };

  const handleChat = (id: number) => {
    router.push(`/analysis/${id}`);
  };

  const goToDetail = (id: number) => {
    router.push(`/data/${id}`);
  };

  const statusMessage = !hasAccessToken
    ? '로그인 후 데이터 소스를 확인할 수 있습니다.'
    : isListLoading
      ? '데이터 소스를 불러오는 중입니다.'
      : isListError
        ? '데이터 소스를 불러오지 못했습니다.'
        : dataSources.length === 0
          ? '업로드된 데이터 소스가 없습니다.'
          : null;

  return (
    <main className="scrollbar-hide flex min-h-0 flex-1 flex-col overflow-y-auto px-40 pt-32 pb-40">
      <h1 className="mb-24 text-head2 font-semibold text-gray-900">
        데이터 소스
      </h1>

      <div className="mb-16 flex items-center justify-between">
        <SortDropdown
          options={SORT_OPTIONS}
          value={sortKey}
          onChange={(v) => setSortKey(v as SortKey)}
        />
        <div className="flex items-center gap-16">
          {hasSelection && (
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={deleteMutation.isPending}
              className="text-body4 text-gray-700 underline underline-offset-2 hover:text-gray-900 disabled:cursor-not-allowed disabled:text-gray-500"
            >
              삭제하기
            </button>
          )}
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={!hasAccessToken || uploadMutation.isPending}
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
              <th className="w-[18rem] py-16 text-left font-semibold">
                최근 업로드
              </th>
              <th className="w-[14rem] py-16 pr-24 text-right font-semibold">
                액션
              </th>
            </tr>
          </thead>
          <tbody>
            {statusMessage ? (
              <tr>
                <td colSpan={5} className="py-48 text-center text-gray-600">
                  {statusMessage}
                </td>
              </tr>
            ) : (
              dataSources.map((row) => {
                const checked = selectedVisibleIdSet.has(row.dataSourceId);
                return (
                  <tr
                    key={row.dataSourceId}
                    onClick={() => goToDetail(row.dataSourceId)}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter' && event.key !== ' ') return;
                      event.preventDefault();
                      goToDetail(row.dataSourceId);
                    }}
                    tabIndex={0}
                    role="button"
                    className="cursor-pointer border-t border-gray-200 transition-colors hover:bg-gray-100 focus-visible:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-500"
                  >
                    <td
                      className="py-16 pl-24"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={checked}
                        onChange={() => toggleOne(row.dataSourceId)}
                      />
                    </td>
                    <td className="py-16 text-gray-900">{row.fileName}</td>
                    <td className="py-16 text-gray-800">
                      {formatFileSize(row.fileSize)}
                    </td>
                    <td className="py-16 text-gray-800">
                      {formatDateTime(row.uploadedAt)}
                    </td>
                    <td
                      className="py-16 pr-24 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleChat(row.dataSourceId)}
                        className="inline-flex items-center gap-4 rounded-full border border-gray-300 bg-white px-12 py-6 text-body4 text-gray-700 transition-colors hover:bg-gray-100"
                      >
                        <ChatIcon
                          aria-hidden
                          className="icon-12 text-orange-500"
                        />
                        <span>채팅</span>
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
              disabled={deleteMutation.isPending}
              className="min-w-[12rem] rounded-full bg-gray-300 px-20 py-12 text-body2 font-medium text-gray-700 transition-colors hover:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              취소하기
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="min-w-[12rem] rounded-full bg-orange-500 px-20 py-12 text-body2 font-medium text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {deleteMutation.isPending ? '삭제 중' : '삭제하기'}
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

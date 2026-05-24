'use client';

import { use, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  dataSourceKeys,
  deleteDataSource,
  getDataSource,
} from '@/apis/datasource';
import { Modal, ToastAlert } from '@/components';
import { formatDateTime } from '@/lib/dateTime';
import { formatFileSize } from '@/lib/fileValidation';
import { useAuthSession } from '@/providers/AuthProvider';
import DataChartCard from '../_components/DataChartCard';

type PageParams = { id: string };

const DELETE_ILLUST_SRC = '/illusts/delete.svg';
const TOAST_DURATION_MS = 2500;

function DataDetailStatus({ message }: { message: string }) {
  const router = useRouter();

  return (
    <main className="scrollbar-hide flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-40 pt-32 pb-40">
      <p className="mb-16 text-body3 text-gray-700">{message}</p>
      <button
        type="button"
        onClick={() => router.push('/data')}
        className="rounded-full bg-orange-500 px-16 py-8 text-body4 font-medium text-white transition-colors hover:bg-orange-600"
      >
        목록으로 돌아가기
      </button>
    </main>
  );
}

export default function DataDetailPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasAccessToken } = useAuthSession();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const dataSourceId = Number(id);
  const isValidDataSourceId =
    Number.isSafeInteger(dataSourceId) && dataSourceId > 0;

  const {
    data: detail,
    isError,
    isLoading,
  } = useQuery({
    queryKey: dataSourceKeys.detail(dataSourceId),
    queryFn: () => getDataSource(dataSourceId),
    enabled: hasAccessToken && isValidDataSourceId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteDataSource(dataSourceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: dataSourceKeys.lists(),
      });
      void queryClient.invalidateQueries({
        queryKey: dataSourceKeys.detail(dataSourceId),
      });
    },
  });

  const handleChat = () => {
    router.push(`/analysis/${id}`);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync();
      setDeleteOpen(false);
      router.push('/data');
    } catch {
      setDeleteOpen(false);
      setToastMessage('파일 삭제에 실패했습니다.');
    }
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(
      () => setToastMessage(null),
      TOAST_DURATION_MS,
    );
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  if (!isValidDataSourceId) {
    return <DataDetailStatus message="올바르지 않은 데이터 소스입니다." />;
  }

  if (!hasAccessToken) {
    return (
      <DataDetailStatus message="로그인 후 데이터 소스를 확인할 수 있습니다." />
    );
  }

  if (isLoading) {
    return <DataDetailStatus message="데이터 소스를 불러오는 중입니다." />;
  }

  if (isError || !detail) {
    return <DataDetailStatus message="데이터 소스를 불러오지 못했습니다." />;
  }

  return (
    <main className="scrollbar-hide flex min-h-0 flex-1 flex-col overflow-y-auto px-40 pt-32 pb-40">
      <DataChartCard
        fileName={detail.fileName}
        fileSize={formatFileSize(detail.fileSize)}
        uploadedAt={formatDateTime(detail.uploadedAt)}
        preview={detail.preview}
        onChat={handleChat}
        onDelete={() => setDeleteOpen(true)}
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

      {toastMessage && (
        <div className="pointer-events-none fixed bottom-[4.4rem] left-1/2 z-[60] -translate-x-1/2">
          <ToastAlert role="alert">{toastMessage}</ToastAlert>
        </div>
      )}
    </main>
  );
}

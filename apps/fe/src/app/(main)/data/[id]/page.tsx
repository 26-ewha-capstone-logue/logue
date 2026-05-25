'use client';

import { use, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  dataSourceKeys,
  deleteDataSource,
  getDataSource,
} from '@/apis/datasource';
import { ConfirmModal, ToastPortal } from '@/components';
import { useToast } from '@/hooks/useToast';
import { formatDateTime } from '@/lib/dateTime';
import { formatFileSize } from '@/lib/fileValidation';
import { useAuthSession } from '@/providers/AuthProvider';
import DataChartCard from '../_components/DataChartCard';

type PageParams = { id: string };

const DELETE_ILLUST_SRC = '/illusts/delete.svg';

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
  const { toast, showToast } = useToast();

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
      showToast('파일 삭제에 실패했습니다.');
    }
  };

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

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => void handleDeleteConfirm()}
        title="파일을 삭제하시겠어요?"
        description="삭제 후에는 복구할 수 없어요."
        confirmLabel={deleteMutation.isPending ? '삭제 중' : '삭제하기'}
        cancelLabel="취소하기"
        confirmDisabled={deleteMutation.isPending}
        cancelDisabled={deleteMutation.isPending}
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

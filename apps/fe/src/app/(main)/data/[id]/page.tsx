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
import { useStartAnalysis } from '@/hooks/useStartAnalysis';
import { useToast } from '@/hooks/useToast';
import { formatDateTime } from '@/lib/dateTime';
import { formatFileSize } from '@/lib/fileValidation';
import { useAuthSession } from '@/providers/AuthProvider';
import DataChartCard from '../_components/DataChartCard';

type PageParams = { id: string };

const DELETE_ILLUST_SRC = '/illusts/delete.svg';
const LOGIN_REQUIRED_MESSAGE = '로그인이 필요해요. 다시 로그인해 주세요.';
const START_CHAT_ERROR_MESSAGE =
  '분석 채팅을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.';

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
  const { hasAccessToken, status } = useAuthSession();
  const isAuthenticated = status === 'authenticated';
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { toast, showToast } = useToast();
  const startAnalysis = useStartAnalysis({
    loginRequiredMessage: LOGIN_REQUIRED_MESSAGE,
    fallbackErrorMessage: START_CHAT_ERROR_MESSAGE,
    onError: showToast,
  });

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
    enabled: isAuthenticated && isValidDataSourceId,
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
    if (!detail) return;

    startAnalysis.startAnalysis({
      type: 'dataSource',
      dataSourceId,
      fileName: detail.fileName,
    });
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

  if (status === 'initializing') {
    return <DataDetailStatus message="데이터 소스를 불러오는 중입니다." />;
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
        chatDisabled={startAnalysis.isPending}
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

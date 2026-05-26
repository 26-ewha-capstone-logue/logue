'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ToastPortal } from '@/components';
import { useToast } from '@/hooks/useToast';
import { useAuthSession } from '@/providers/AuthProvider';
import DataDetailStatus from './_components/DataDetailStatus';
import DataDetailView from './_components/DataDetailView';
import { useDataDetail } from './_hooks/useDataDetail';

type PageParams = { id: string };

export default function DataDetailPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { hasAccessToken, status } = useAuthSession();
  const isAuthenticated = status === 'authenticated';
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { toast, showToast } = useToast();

  const dataSourceId = Number(id);
  const isValidDataSourceId =
    Number.isSafeInteger(dataSourceId) && dataSourceId > 0;
  const dataDetail = useDataDetail({
    dataSourceId: isValidDataSourceId ? dataSourceId : 0,
    enabled: isAuthenticated && isValidDataSourceId,
  });

  const handleDeleteConfirm = async () => {
    try {
      await dataDetail.deleteDataSource();
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

  if (dataDetail.isLoading) {
    return <DataDetailStatus message="데이터 소스를 불러오는 중입니다." />;
  }

  if (dataDetail.isError || !dataDetail.detail) {
    return <DataDetailStatus message="데이터 소스를 불러오지 못했습니다." />;
  }

  return (
    <>
      <DataDetailView
        deleteOpen={deleteOpen}
        deletePending={dataDetail.deletePending}
        detail={dataDetail.detail}
        onChat={() => router.push(`/analysis/${id}`)}
        onDelete={() => setDeleteOpen(true)}
        onDeleteClose={() => setDeleteOpen(false)}
        onDeleteConfirm={() => void handleDeleteConfirm()}
      />
      <ToastPortal toast={toast} />
    </>
  );
}

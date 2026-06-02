'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ToastPortal } from '@/components';
import { DATA_SOURCE_MESSAGES } from '@/constants/messages';
import { useToast } from '@/hooks/useToast';
import DataDetailStatus from './_components/DataDetailStatus';
import DataDetailView from './_components/DataDetailView';
import { useDataDetail } from '@/features/dataSource/hooks/useDataDetail';
import { useDataSourceDeleteFlow } from '@/features/dataSource/hooks/useDataSourceDeleteFlow';
import { useDataSourceUserContext } from '@/features/dataSource/hooks/useDataSourceUserContext';

type PageParams = { id: string };

export default function DataDetailPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { hasAccessToken, isAuthenticated, mockDataSource, status } =
    useDataSourceUserContext();
  const { toast, showToast } = useToast();

  const dataSourceId = Number(id);
  const isValidDataSourceId =
    Number.isSafeInteger(dataSourceId) && dataSourceId > 0;
  const isDeletedMockDataSource =
    mockDataSource.isDeletedDataSource(dataSourceId);
  const dataDetail = useDataDetail({
    dataSourceId: isValidDataSourceId ? dataSourceId : null,
    enabled: isAuthenticated && isValidDataSourceId && !isDeletedMockDataSource,
  });
  const deleteFlow = useDataSourceDeleteFlow({
    conflictErrorMessage: DATA_SOURCE_MESSAGES.deleteConflict,
    fallbackErrorMessage: DATA_SOURCE_MESSAGES.detailDeleteError,
    mockDataSource,
    onDeleted: () => router.push('/data'),
    showToast,
  });

  const handleDeleteConfirm = async () => {
    await deleteFlow.confirmDelete([dataSourceId]);
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

  if (isDeletedMockDataSource || dataDetail.isError || !dataDetail.detail) {
    return <DataDetailStatus message="데이터 소스를 불러오지 못했습니다." />;
  }

  return (
    <>
      <DataDetailView
        deleteOpen={deleteFlow.deleteOpen}
        deletePending={deleteFlow.deletePending}
        detail={dataDetail.detail}
        onChat={() => router.push(`/analysis/${id}`)}
        onDelete={deleteFlow.openDelete}
        onDeleteClose={deleteFlow.closeDelete}
        onDeleteConfirm={() => void handleDeleteConfirm()}
      />
      <ToastPortal toast={toast} />
    </>
  );
}

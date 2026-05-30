'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ToastPortal } from '@/components';
import { AUTH_MESSAGES, DATA_SOURCE_MESSAGES } from '@/constants/messages';
import { useToast } from '@/hooks/useToast';
import DataDetailStatus from './_components/DataDetailStatus';
import DataDetailView from './_components/DataDetailView';
import { useDataDetail } from './_hooks/useDataDetail';
import { useDataSourceUserContext } from '../_hooks/useDataSourceUserContext';
import { getDataSourceDeleteErrorMessage } from '../_utils/dataSourceErrorMessage';

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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { toast, showToast } = useToast();

  const dataSourceId = Number(id);
  const isValidDataSourceId =
    Number.isSafeInteger(dataSourceId) && dataSourceId > 0;
  const isDeletedMockDataSource =
    mockDataSource.isDeletedDataSource(dataSourceId);
  const dataDetail = useDataDetail({
    dataSourceId: isValidDataSourceId ? dataSourceId : 0,
    enabled: isAuthenticated && isValidDataSourceId && !isDeletedMockDataSource,
  });

  const handleDeleteConfirm = async () => {
    try {
      const deletionPlan = mockDataSource.getDeletionPlan([dataSourceId]);

      if (deletionPlan.requiresUser) {
        throw new Error(AUTH_MESSAGES.userInfoRequired);
      }

      if (deletionPlan.serverDataSourceIds.length > 0) {
        await dataDetail.deleteDataSource();
      }

      if (deletionPlan.mockDataSourceIds.length > 0) {
        mockDataSource.markDeletedDataSources(deletionPlan.mockDataSourceIds);
      }

      setDeleteOpen(false);
      router.push('/data');
    } catch (error) {
      setDeleteOpen(false);
      showToast(
        getDataSourceDeleteErrorMessage(error, {
          conflict: DATA_SOURCE_MESSAGES.deleteConflict,
          fallback: DATA_SOURCE_MESSAGES.detailDeleteError,
        }),
      );
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

  if (isDeletedMockDataSource || dataDetail.isError || !dataDetail.detail) {
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

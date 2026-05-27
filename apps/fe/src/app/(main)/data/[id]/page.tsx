'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiErrorMessage, isApiConflictError } from '@/apis/errors';
import { isMockDataSourceId } from '@/apis/mockDataSource';
import { ToastPortal } from '@/components';
import { useMyInfo } from '@/hooks/useMyInfo';
import { useToast } from '@/hooks/useToast';
import { useAuthSession } from '@/providers/AuthProvider';
import DataDetailStatus from './_components/DataDetailStatus';
import DataDetailView from './_components/DataDetailView';
import { useDataDetail } from './_hooks/useDataDetail';
import { useDeletedMockDataSources } from '../_hooks/useDeletedMockDataSources';

type PageParams = { id: string };

const DELETE_ERROR_MESSAGE = '파일 삭제에 실패했습니다.';
const DELETE_CONFLICT_ERROR_MESSAGE =
  '연결된 분석 채팅이 있어 현재 삭제할 수 없어요. 채팅 삭제 기능이 준비되면 함께 삭제할 수 있습니다.';
const USER_INFO_REQUIRED_MESSAGE =
  '사용자 정보를 확인한 뒤 다시 시도해 주세요.';

export default function DataDetailPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { hasAccessToken, isAuthenticated, status } = useAuthSession();
  const { data: myInfo } = useMyInfo(isAuthenticated);
  const { deletedMockDataSourceIds, markDeletedMockDataSources } =
    useDeletedMockDataSources(myInfo?.id);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { toast, showToast } = useToast();

  const dataSourceId = Number(id);
  const isValidDataSourceId =
    Number.isSafeInteger(dataSourceId) && dataSourceId > 0;
  const isDeletedMockDataSource =
    isMockDataSourceId(dataSourceId) &&
    deletedMockDataSourceIds.has(dataSourceId);
  const dataDetail = useDataDetail({
    dataSourceId: isValidDataSourceId ? dataSourceId : 0,
    enabled: isAuthenticated && isValidDataSourceId && !isDeletedMockDataSource,
  });

  const handleDeleteConfirm = async () => {
    try {
      if (isMockDataSourceId(dataSourceId)) {
        if (!myInfo?.id) throw new Error(USER_INFO_REQUIRED_MESSAGE);

        markDeletedMockDataSources([dataSourceId]);
      } else {
        await dataDetail.deleteDataSource();
      }

      setDeleteOpen(false);
      router.push('/data');
    } catch (error) {
      setDeleteOpen(false);
      showToast(
        isApiConflictError(error)
          ? DELETE_CONFLICT_ERROR_MESSAGE
          : getApiErrorMessage(error, DELETE_ERROR_MESSAGE),
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

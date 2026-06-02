'use client';

import { use } from 'react';
import { ToastPortal } from '@/components';
import DataDetailStatus from './_components/DataDetailStatus';
import DataDetailView from './_components/DataDetailView';
import { useDataDetailPageController } from './_hooks/useDataDetailPageController';

type PageParams = { id: string };

export default function DataDetailPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { id } = use(params);
  const controller = useDataDetailPageController(id);

  if (controller.status === 'status') {
    return <DataDetailStatus message={controller.message} />;
  }

  return (
    <>
      <DataDetailView
        deleteOpen={controller.deleteOpen}
        deletePending={controller.deletePending}
        detail={controller.detail}
        onChat={controller.onChat}
        onDelete={controller.onDelete}
        onDeleteClose={controller.onDeleteClose}
        onDeleteConfirm={controller.onDeleteConfirm}
      />
      <ToastPortal toast={controller.toast} />
    </>
  );
}

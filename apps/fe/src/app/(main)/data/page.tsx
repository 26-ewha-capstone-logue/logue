'use client';

import { FileUploadModal, ToastPortal } from '@/components';
import { DeleteConfirmModal } from '@/features/dataSource';
import DataSourceTable from './_components/DataSourceTable';
import DataSourceToolbar from './_components/DataSourceToolbar';
import { useDataPageController } from './_hooks/useDataPageController';

export default function DataPage() {
  const controller = useDataPageController();

  return (
    <main className="scrollbar-hide flex min-h-0 flex-1 flex-col overflow-y-auto px-40 pt-32 pb-40">
      <h1 className="mb-24 text-head2 font-semibold text-gray-900">
        데이터 소스
      </h1>

      <DataSourceToolbar {...controller.toolbar} />

      <DataSourceTable {...controller.table} />

      <FileUploadModal {...controller.uploadModal} />

      <DeleteConfirmModal {...controller.deleteModal} />

      <ToastPortal toast={controller.toast} />
    </main>
  );
}

'use client';

import {
  DeleteConfirmModal,
  type GetFileResponse,
} from '@/features/dataSource';
import { DATA_SOURCE_MESSAGES } from '@/constants/messages';
import { formatDateTime } from '@/lib/dateTime';
import { formatFileSize } from '@/lib/fileValidation';
import DataChartCard from '../../_components/DataChartCard';

type DataDetailViewProps = {
  deleteOpen: boolean;
  deletePending: boolean;
  detail: GetFileResponse;
  onChat: () => void;
  onDelete: () => void;
  onDeleteClose: () => void;
  onDeleteConfirm: () => void;
};

export default function DataDetailView({
  deleteOpen,
  deletePending,
  detail,
  onChat,
  onDelete,
  onDeleteClose,
  onDeleteConfirm,
}: DataDetailViewProps) {
  return (
    <main className="scrollbar-hide flex min-h-0 flex-1 flex-col overflow-y-auto px-40 pt-32 pb-40">
      <DataChartCard
        fileName={detail.fileName}
        fileSize={formatFileSize(detail.fileSize)}
        uploadedAt={formatDateTime(detail.uploadedAt)}
        preview={detail.preview}
        onChat={onChat}
        onDelete={onDelete}
      />

      <DeleteConfirmModal
        open={deleteOpen}
        onClose={onDeleteClose}
        onConfirm={onDeleteConfirm}
        isPending={deletePending}
        pendingConfirmLabel={DATA_SOURCE_MESSAGES.deletePendingLabel}
        cancelDisabledOnPending
      />
    </main>
  );
}

'use client';

import { ConfirmModal } from '@/components';
import type { GetFileResponse } from '@/features/dataSource';
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

const DELETE_ILLUST_SRC = '/illusts/delete.svg';

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

      <ConfirmModal
        open={deleteOpen}
        onClose={onDeleteClose}
        onConfirm={onDeleteConfirm}
        title="파일을 삭제하시겠어요?"
        description="삭제 후에는 복구할 수 없어요."
        confirmLabel={deletePending ? '삭제 중' : '삭제하기'}
        cancelLabel="취소하기"
        confirmDisabled={deletePending}
        cancelDisabled={deletePending}
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
    </main>
  );
}

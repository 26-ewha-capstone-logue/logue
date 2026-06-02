'use client';

import { ConfirmModal } from '@/components';
import { DATA_SOURCE_MESSAGES } from '@/constants/messages';

const DELETE_ILLUST_SRC = '/illusts/delete.svg';

export type DeleteConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  cancelDisabledOnPending?: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  pendingConfirmLabel?: string;
  cancelLabel?: string;
};

export default function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  isPending,
  cancelDisabledOnPending = false,
  title = DATA_SOURCE_MESSAGES.deleteTitle,
  description = DATA_SOURCE_MESSAGES.deleteDescription,
  confirmLabel = DATA_SOURCE_MESSAGES.deleteConfirmLabel,
  pendingConfirmLabel = DATA_SOURCE_MESSAGES.deletePendingLabel,
  cancelLabel = DATA_SOURCE_MESSAGES.deleteCancelLabel,
}: DeleteConfirmModalProps) {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      description={description}
      confirmLabel={isPending ? pendingConfirmLabel : confirmLabel}
      cancelLabel={cancelLabel}
      confirmDisabled={isPending}
      cancelDisabled={cancelDisabledOnPending && isPending}
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
  );
}

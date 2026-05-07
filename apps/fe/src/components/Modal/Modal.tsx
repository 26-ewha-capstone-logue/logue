'use client';

import { useEffect, type ReactNode } from 'react';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export default function Modal({ open, onClose, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-[44rem] rounded-20 bg-white p-32 shadow-[0_0.8rem_3.2rem_rgba(0,0,0,0.12)]">
        {children}
      </div>
    </div>
  );
}

export type ConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: ReactNode;
};

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = '삭제하기',
  cancelLabel = '취소하기',
  icon,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex flex-col items-center gap-16 text-center">
        {icon && <div className="mb-8">{icon}</div>}
        <h2 className="text-head4 text-gray-900">{title}</h2>
        {description && (
          <p className="text-body2 text-gray-600">{description}</p>
        )}
        <div className="mt-16 flex w-full gap-12">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-12 border border-gray-300 bg-white py-12 text-body3 text-gray-700 transition-colors hover:bg-gray-100"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-12 bg-orange-500 py-12 text-body3 text-white transition-colors hover:bg-orange-600"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

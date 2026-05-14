'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

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

  // body 스크롤 잠금
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open) return null;
  // SSR 환경에서는 document 가 없으므로 client mount 후에만 portal 렌더
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      // Tailwind JIT 가 fixed/inset-0 을 누락하는 케이스를 피하기 위해 inline style 로도 박는다
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={onClose}
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(236, 236, 236, 0.8)',
        }}
      />
      <div
        className="relative z-10 w-full max-w-[60rem] rounded-20 bg-white p-32 shadow-[0_0.8rem_3.2rem_rgba(0,0,0,0.12)]"
        style={{ position: 'relative', zIndex: 10 }}
      >
        {children}
      </div>
    </div>,
    document.body,
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

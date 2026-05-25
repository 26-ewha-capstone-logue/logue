'use client';

import { createPortal } from 'react-dom';
import SuccessIcon from '@/assets/icons/success.svg';
import type { ToastState } from '@/hooks/useToast';
import ToastAlert from './ToastAlert';

export type ToastPortalProps = {
  toast: ToastState | null;
};

export default function ToastPortal({ toast }: ToastPortalProps) {
  if (!toast) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="pointer-events-none fixed bottom-[4.4rem] left-1/2 z-[60] -translate-x-1/2">
      <ToastAlert
        role={toast.tone === 'error' ? 'alert' : 'status'}
        icon={
          toast.tone === 'success' ? (
            <SuccessIcon aria-hidden className="icon-24" />
          ) : undefined
        }
      >
        {toast.message}
      </ToastAlert>
    </div>,
    document.body,
  );
}

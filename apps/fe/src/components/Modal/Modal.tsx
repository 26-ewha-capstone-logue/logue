'use client';

import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** 보조 기기에 모달의 의미를 알려주는 라벨 텍스트 (간단한 한 줄) */
  ariaLabel?: string;
  /** 라벨 역할을 하는 요소 id (모달 내부 heading 등). ariaLabel 보다 우선 적용 */
  ariaLabelledBy?: string;
  /** 모달 내부 설명 영역 id */
  ariaDescribedBy?: string;
  contentClassName?: string;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
};

const DEFAULT_CONTENT_CLASS_NAME =
  'relative z-10 w-full max-w-[60rem] rounded-20 bg-white p-32 shadow-[0_0.8rem_3.2rem_rgba(0,0,0,0.12)]';
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function isFocusableElementVisible(element: HTMLElement) {
  if (
    element.hasAttribute('disabled') ||
    element.getAttribute('aria-hidden') === 'true' ||
    element.closest('[aria-hidden="true"]')
  ) {
    return false;
  }

  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') return false;

  return element.getClientRects().length > 0;
}

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter(isFocusableElementVisible);
}

export default function Modal({
  open,
  onClose,
  children,
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  contentClassName = DEFAULT_CONTENT_CLASS_NAME,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open || !closeOnEscape) return;
    const handleKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [closeOnEscape, open, onClose]);

  // body 스크롤 잠금
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    previousActiveElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const frameId = window.requestAnimationFrame(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;

      const firstFocusableElement = getFocusableElements(dialog)[0];
      (firstFocusableElement ?? dialog).focus();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      previousActiveElementRef.current?.focus();
      previousActiveElementRef.current = null;
    };
  }, [open]);

  const handleDialogKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusableElements = getFocusableElements(dialog);
    if (focusableElements.length === 0) {
      event.preventDefault();
      dialog.focus();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey) {
      if (activeElement === firstElement || !dialog.contains(activeElement)) {
        event.preventDefault();
        lastElement.focus();
      }
      return;
    }

    if (activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

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
        onClick={closeOnOverlayClick ? onClose : undefined}
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
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabelledBy ? undefined : ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
        className={contentClassName}
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
  const titleId = useId();
  const descriptionId = useId();

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabelledBy={titleId}
      ariaDescribedBy={description ? descriptionId : undefined}
      closeOnOverlayClick={false}
    >
      <div className="flex flex-col items-center gap-16 text-center">
        {icon && <div className="mb-8">{icon}</div>}
        <h2 id={titleId} className="text-head4 text-gray-900">
          {title}
        </h2>
        {description && (
          <p id={descriptionId} className="text-body2 text-gray-600">
            {description}
          </p>
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

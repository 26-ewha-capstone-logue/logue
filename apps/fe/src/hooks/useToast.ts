'use client';

import { useCallback, useEffect, useState } from 'react';

export const DEFAULT_TOAST_DURATION_MS = 2500;

export type ToastTone = 'error' | 'success';

export type ToastState = {
  message: string;
  tone: ToastTone;
};

export function useToast(durationMs = DEFAULT_TOAST_DURATION_MS) {
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => setToast(null), durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, toast]);

  const showToast = useCallback(
    (message: string, tone: ToastTone = 'error') => {
      setToast({ message, tone });
    },
    [],
  );

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  return { toast, showToast, clearToast };
}

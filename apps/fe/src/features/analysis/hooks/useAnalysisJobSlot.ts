'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type AnalysisJobPhase<TResult, TError extends { message: string }> = {
  error?: TError | null;
  pending: boolean;
  result?: TResult;
};

type UseAnalysisJobSlotParams<
  TKey,
  TJob,
  TResult,
  TError extends { message: string },
> = {
  getJobKey: (job: TJob) => TKey;
  isSameKey?: (left: TKey, right: TKey) => boolean;
  onError: (job: TJob, error: TError) => void;
  onResult: (job: TJob, result: TResult) => void;
  usePhase: (pendingJob: TJob | null) => AnalysisJobPhase<TResult, TError>;
};

function hasValue<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function useAnalysisJobSlot<
  TKey,
  TJob,
  TResult,
  TError extends { message: string } = { message: string },
>({
  getJobKey,
  isSameKey,
  onError,
  onResult,
  usePhase,
}: UseAnalysisJobSlotParams<TKey, TJob, TResult, TError>) {
  const activeRef = useRef(false);
  const activeKeyRef = useRef<TKey | null>(null);
  const handledKeyRef = useRef<TKey | null>(null);
  const pendingKeyRef = useRef<TKey | null>(null);
  const pendingJobRef = useRef<TJob | null>(null);
  const [pendingKey, setPendingKeyState] = useState<TKey | null>(null);
  const [pendingJob, setPendingJobState] = useState<TJob | null>(null);

  const phase = usePhase(pendingJob);
  const keysMatch = useCallback(
    (left: TKey, right: TKey) =>
      isSameKey ? isSameKey(left, right) : Object.is(left, right),
    [isSameKey],
  );
  const setPendingKey = useCallback((key: TKey | null) => {
    pendingKeyRef.current = key;
    setPendingKeyState(key);
  }, []);
  const setPendingJob = useCallback((job: TJob | null) => {
    pendingJobRef.current = job;
    setPendingJobState(job);
  }, []);
  const startSlot = useCallback(
    (key?: TKey) => {
      activeRef.current = true;
      activeKeyRef.current = key ?? null;
      handledKeyRef.current = null;
      setPendingKey(key ?? null);
      setPendingJob(null);
    },
    [setPendingJob, setPendingKey],
  );
  const setSlotJob = useCallback(
    (job: TJob) => {
      const key = getJobKey(job);

      activeRef.current = true;
      activeKeyRef.current = key;
      setPendingKey(key);
      setPendingJob(job);
    },
    [getJobKey, setPendingJob, setPendingKey],
  );
  const clearSlot = useCallback(
    (key: TKey) => {
      const activeKey = activeKeyRef.current;
      if (activeKey === null || keysMatch(activeKey, key)) {
        activeRef.current = false;
        activeKeyRef.current = null;
      }

      const currentKey = pendingKeyRef.current;
      if (currentKey !== null && keysMatch(currentKey, key)) {
        setPendingKey(null);
      }

      const currentJob = pendingJobRef.current;
      if (currentJob !== null && keysMatch(getJobKey(currentJob), key)) {
        setPendingJob(null);
      }
    },
    [getJobKey, keysMatch, setPendingJob, setPendingKey],
  );
  const resetSlot = useCallback(() => {
    activeRef.current = false;
    activeKeyRef.current = null;
    handledKeyRef.current = null;
    setPendingKey(null);
    setPendingJob(null);
  }, [setPendingJob, setPendingKey]);
  const isSlotActive = useCallback(
    () =>
      activeRef.current ||
      pendingKeyRef.current !== null ||
      pendingJobRef.current !== null,
    [],
  );

  useEffect(() => {
    if (pendingJob === null) return;
    if (phase.pending) return;

    const jobKey = getJobKey(pendingJob);
    const handledKey = handledKeyRef.current;
    if (handledKey !== null && keysMatch(handledKey, jobKey)) {
      return;
    }

    const result = phase.result;
    if (hasValue(result)) {
      handledKeyRef.current = jobKey;
      queueMicrotask(() => {
        clearSlot(jobKey);
        onResult(pendingJob, result);
      });
      return;
    }

    const error = phase.error;
    if (error) {
      handledKeyRef.current = jobKey;
      queueMicrotask(() => {
        clearSlot(jobKey);
        onError(pendingJob, error);
      });
    }
  }, [
    clearSlot,
    getJobKey,
    keysMatch,
    onError,
    onResult,
    pendingJob,
    phase.error,
    phase.pending,
    phase.result,
  ]);

  return {
    clearSlot,
    isSlotActive,
    pendingJob,
    pendingKey,
    phase,
    resetSlot,
    setSlotJob,
    startSlot,
  };
}

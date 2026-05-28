'use client';

import { useCallback, useRef } from 'react';
import type { QuestionResultParams } from '@/apis/analysis';
import { getResultCancelKey } from '../_utils/analysisCancelTarget';

export function useAnalysisCancellationRegistry() {
  const canceledCriteriaOperationKeysRef = useRef(new Set<string>());
  const canceledResultKeysRef = useRef(new Set<string>());

  const markCriteriaCanceled = useCallback((operationKey: string) => {
    canceledCriteriaOperationKeysRef.current.add(operationKey);
  }, []);
  const consumeCanceledCriteriaOperation = useCallback(
    (operationKey: string) =>
      canceledCriteriaOperationKeysRef.current.delete(operationKey),
    [],
  );
  const markResultCanceled = useCallback((params: QuestionResultParams) => {
    canceledResultKeysRef.current.add(getResultCancelKey(params));
  }, []);
  const consumeCanceledResult = useCallback(
    (params: Pick<QuestionResultParams, 'analysisCriteriaId' | 'messageId'>) =>
      canceledResultKeysRef.current.delete(getResultCancelKey(params)),
    [],
  );

  return {
    consumeCanceledCriteriaOperation,
    consumeCanceledResult,
    markCriteriaCanceled,
    markResultCanceled,
  };
}

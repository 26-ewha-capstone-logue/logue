import { describe, expect, it } from 'vitest';
import {
  getAnalysisCancelTarget,
  getResultCancelKey,
  type PendingCriteriaCancelTarget,
} from '../utils/analysisCancelTarget';
import type { QuestionResultParams } from '@/apis/analysis';

const pendingCriteria: PendingCriteriaCancelTarget = {
  operationKey: 'criteria-1',
  params: {
    conversationId: 1,
    analysisFlowId: 2,
    messageId: 3,
  },
};

const pendingResult: QuestionResultParams = {
  conversationId: 1,
  analysisFlowId: 2,
  messageId: 3,
  analysisCriteriaId: 4,
};

describe('getAnalysisCancelTarget', () => {
  it('returns a summary cancel target while summary is pending', () => {
    expect(
      getAnalysisCancelTarget({
        analysisFlowId: 2,
        conversationId: 1,
        isQuestionAnalysisPending: false,
        isResultAnalysisPending: false,
        pendingCriteriaCancelTarget: null,
        pendingResultCancelParams: null,
        summaryPending: true,
      }),
    ).toEqual({
      stage: 'summary',
      params: {
        conversationId: 1,
        analysisFlowId: 2,
      },
    });
  });

  it('returns a criteria cancel target only after the message is created', () => {
    expect(
      getAnalysisCancelTarget({
        analysisFlowId: 2,
        conversationId: 1,
        isQuestionAnalysisPending: true,
        isResultAnalysisPending: false,
        pendingCriteriaCancelTarget: pendingCriteria,
        pendingResultCancelParams: null,
        summaryPending: false,
      }),
    ).toEqual({
      stage: 'criteria',
      operationKey: 'criteria-1',
      params: pendingCriteria.params,
    });
  });

  it('prioritizes result cancellation over earlier phases', () => {
    expect(
      getAnalysisCancelTarget({
        analysisFlowId: 2,
        conversationId: 1,
        isQuestionAnalysisPending: true,
        isResultAnalysisPending: true,
        pendingCriteriaCancelTarget: pendingCriteria,
        pendingResultCancelParams: pendingResult,
        summaryPending: true,
      }),
    ).toEqual({
      stage: 'result',
      params: pendingResult,
    });
  });

  it('returns null when the active phase has no cancellable server params', () => {
    expect(
      getAnalysisCancelTarget({
        analysisFlowId: null,
        conversationId: 1,
        isQuestionAnalysisPending: true,
        isResultAnalysisPending: false,
        pendingCriteriaCancelTarget: null,
        pendingResultCancelParams: null,
        summaryPending: true,
      }),
    ).toBeNull();
  });
});

describe('getResultCancelKey', () => {
  it('uses the message and criteria ids as a stable key', () => {
    expect(getResultCancelKey(pendingResult)).toBe('3:4');
  });
});

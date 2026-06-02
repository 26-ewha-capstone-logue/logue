import { describe, expect, it } from 'vitest';
import {
  analysisWorkflowReducer,
  initialAnalysisWorkflowState,
  isCriteriaSubmissionLocked,
  isQuestionSubmissionLocked,
  type AnalysisWorkflowAction,
} from '../models/analysisWorkflowState';

function reduceWorkflow(actions: AnalysisWorkflowAction[]) {
  return actions.reduce(analysisWorkflowReducer, initialAnalysisWorkflowState);
}

describe('analysisWorkflowReducer', () => {
  it('tracks summary loading before returning to idle when the summary is ready', () => {
    const pending = reduceWorkflow([{ type: 'summary-pending' }]);

    expect(pending.status).toBe('summaryPending');

    const ready = analysisWorkflowReducer(pending, { type: 'summary-ready' });

    expect(ready.status).toBe('idle');
  });

  it('tracks the question-to-criteria transition and locks duplicate questions', () => {
    const pending = reduceWorkflow([{ type: 'question-submission-started' }]);

    expect(pending.status).toBe('criteriaPending');
    expect(isQuestionSubmissionLocked(pending)).toBe(true);

    const ready = analysisWorkflowReducer(pending, {
      type: 'question-submission-succeeded',
    });

    expect(ready.status).toBe('criteriaReady');
    expect(isQuestionSubmissionLocked(ready)).toBe(false);
  });

  it('tracks criteria confirmation through result readiness', () => {
    const pending = reduceWorkflow([{ type: 'criteria-submission-started' }]);

    expect(pending.status).toBe('resultPending');
    expect(isCriteriaSubmissionLocked(pending)).toBe(true);

    const ready = analysisWorkflowReducer(pending, {
      type: 'criteria-submission-succeeded',
    });

    expect(ready.status).toBe('resultReady');
    expect(isCriteriaSubmissionLocked(ready)).toBe(false);
  });

  it('keeps auto-start state separate from command phase status', () => {
    const state = reduceWorkflow([
      { type: 'start-payload-resolved', canAutoStartInitialQuestion: true },
      { type: 'initial-question-started' },
      { type: 'question-submission-started' },
    ]);

    expect(state.canAutoStartInitialQuestion).toBe(false);
    expect(state.hasResolvedStartPayload).toBe(true);
    expect(state.hasStartedInitialQuestion).toBe(true);
    expect(state.status).toBe('criteriaPending');
  });

  it('moves command failures and cancellations into terminal states', () => {
    expect(
      reduceWorkflow([
        { type: 'question-submission-started' },
        { type: 'question-submission-failed' },
      ]).status,
    ).toBe('failed');

    expect(
      reduceWorkflow([
        { type: 'criteria-submission-started' },
        { type: 'criteria-submission-canceled' },
      ]).status,
    ).toBe('canceled');
  });
});

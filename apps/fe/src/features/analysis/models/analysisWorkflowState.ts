export type AnalysisWorkflowStatus =
  | 'idle'
  | 'summaryPending'
  | 'criteriaPending'
  | 'criteriaReady'
  | 'resultPending'
  | 'resultReady'
  | 'canceled'
  | 'failed';

export type AnalysisWorkflowState = {
  canAutoStartInitialQuestion: boolean;
  hasResolvedStartPayload: boolean;
  hasStartedInitialQuestion: boolean;
  status: AnalysisWorkflowStatus;
};

export type AnalysisWorkflowAction =
  | { type: 'start-payload-loading' }
  | { type: 'start-payload-resolved'; canAutoStartInitialQuestion: boolean }
  | { type: 'summary-pending' }
  | { type: 'summary-ready' }
  | { type: 'summary-failed' }
  | { type: 'summary-canceled' }
  | { type: 'initial-question-started' }
  | { type: 'auto-start-disabled' }
  | { type: 'question-submission-started' }
  | { type: 'question-submission-succeeded' }
  | { type: 'question-submission-failed' }
  | { type: 'question-submission-canceled' }
  | { type: 'criteria-submission-started' }
  | { type: 'criteria-submission-succeeded' }
  | { type: 'criteria-submission-failed' }
  | { type: 'criteria-submission-canceled' };

export const initialAnalysisWorkflowState: AnalysisWorkflowState = {
  canAutoStartInitialQuestion: false,
  hasResolvedStartPayload: false,
  hasStartedInitialQuestion: false,
  status: 'idle',
};

const questionSubmissionStartStatuses = new Set<AnalysisWorkflowStatus>([
  'idle',
  'criteriaReady',
  'resultReady',
  'canceled',
  'failed',
]);
const criteriaSubmissionStartStatuses = new Set<AnalysisWorkflowStatus>([
  'criteriaReady',
  'resultReady',
  'canceled',
  'failed',
]);

function keepTerminalCancel(
  state: AnalysisWorkflowState,
): AnalysisWorkflowState {
  return state.status === 'canceled' ? state : { ...state, status: 'failed' };
}

function transitionStatusWhen(
  state: AnalysisWorkflowState,
  allowedStatuses: ReadonlySet<AnalysisWorkflowStatus>,
  status: AnalysisWorkflowStatus,
): AnalysisWorkflowState {
  return allowedStatuses.has(state.status) ? { ...state, status } : state;
}

export function isQuestionSubmissionLocked(state: AnalysisWorkflowState) {
  return state.status === 'criteriaPending';
}

export function isCriteriaSubmissionLocked(state: AnalysisWorkflowState) {
  return state.status === 'resultPending';
}

export function analysisWorkflowReducer(
  state: AnalysisWorkflowState,
  action: AnalysisWorkflowAction,
): AnalysisWorkflowState {
  switch (action.type) {
    case 'start-payload-loading':
      return {
        ...state,
        canAutoStartInitialQuestion: false,
        hasResolvedStartPayload: false,
      };
    case 'start-payload-resolved':
      return {
        ...state,
        canAutoStartInitialQuestion: action.canAutoStartInitialQuestion,
        hasResolvedStartPayload: true,
      };
    case 'summary-pending':
      return {
        ...state,
        status: 'summaryPending',
      };
    case 'summary-ready':
      return state.status === 'summaryPending'
        ? { ...state, status: 'idle' }
        : state;
    case 'summary-failed':
      return keepTerminalCancel(state);
    case 'summary-canceled':
      return {
        ...state,
        status: 'canceled',
      };
    case 'initial-question-started':
      return {
        ...state,
        canAutoStartInitialQuestion: false,
        hasStartedInitialQuestion: true,
      };
    case 'auto-start-disabled':
      return {
        ...state,
        canAutoStartInitialQuestion: false,
      };
    case 'question-submission-started':
      return transitionStatusWhen(
        state,
        questionSubmissionStartStatuses,
        'criteriaPending',
      );
    case 'question-submission-succeeded':
      return state.status === 'criteriaPending'
        ? { ...state, status: 'criteriaReady' }
        : state;
    case 'question-submission-failed':
      return state.status === 'criteriaPending'
        ? { ...state, status: 'failed' }
        : state;
    case 'question-submission-canceled':
      return state.status === 'criteriaPending'
        ? { ...state, status: 'canceled' }
        : state;
    case 'criteria-submission-started':
      return transitionStatusWhen(
        state,
        criteriaSubmissionStartStatuses,
        'resultPending',
      );
    case 'criteria-submission-succeeded':
      return state.status === 'resultPending'
        ? { ...state, status: 'resultReady' }
        : state;
    case 'criteria-submission-failed':
      return state.status === 'resultPending'
        ? { ...state, status: 'failed' }
        : state;
    case 'criteria-submission-canceled':
      return state.status === 'resultPending'
        ? { ...state, status: 'canceled' }
        : state;
  }
}

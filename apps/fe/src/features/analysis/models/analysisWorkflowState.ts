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

function keepTerminalCancel(
  state: AnalysisWorkflowState,
): AnalysisWorkflowState {
  return state.status === 'canceled' ? state : { ...state, status: 'failed' };
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
      return state.status === 'summaryPending' || state.status === 'failed'
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
      return {
        ...state,
        status: 'criteriaPending',
      };
    case 'question-submission-succeeded':
      return {
        ...state,
        status: 'criteriaReady',
      };
    case 'question-submission-failed':
      return {
        ...state,
        status: 'failed',
      };
    case 'question-submission-canceled':
      return {
        ...state,
        status: 'canceled',
      };
    case 'criteria-submission-started':
      return {
        ...state,
        status: 'resultPending',
      };
    case 'criteria-submission-succeeded':
      return {
        ...state,
        status: 'resultReady',
      };
    case 'criteria-submission-failed':
      return {
        ...state,
        status: 'failed',
      };
    case 'criteria-submission-canceled':
      return {
        ...state,
        status: 'canceled',
      };
  }
}

export type AnalysisChatFlowState = {
  canAutoStartInitialQuestion: boolean;
  criteriaSubmissionLocked: boolean;
  hasResolvedStartPayload: boolean;
  hasStartedInitialQuestion: boolean;
  questionSubmissionLocked: boolean;
};

export type AnalysisChatFlowAction =
  | { type: 'start-payload-loading' }
  | { type: 'start-payload-resolved'; canAutoStartInitialQuestion: boolean }
  | { type: 'initial-question-started' }
  | { type: 'auto-start-disabled' }
  | { type: 'question-submission-started' }
  | { type: 'question-submission-finished' }
  | { type: 'criteria-submission-started' }
  | { type: 'criteria-submission-finished' };

export const initialAnalysisChatFlowState: AnalysisChatFlowState = {
  canAutoStartInitialQuestion: false,
  criteriaSubmissionLocked: false,
  hasResolvedStartPayload: false,
  hasStartedInitialQuestion: false,
  questionSubmissionLocked: false,
};

export function analysisChatFlowReducer(
  state: AnalysisChatFlowState,
  action: AnalysisChatFlowAction,
): AnalysisChatFlowState {
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
        questionSubmissionLocked: true,
      };
    case 'question-submission-finished':
      return {
        ...state,
        questionSubmissionLocked: false,
      };
    case 'criteria-submission-started':
      return {
        ...state,
        criteriaSubmissionLocked: true,
      };
    case 'criteria-submission-finished':
      return {
        ...state,
        criteriaSubmissionLocked: false,
      };
  }
}

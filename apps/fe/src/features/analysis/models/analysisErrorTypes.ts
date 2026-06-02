export type AnalysisUiStatus =
  | 'idle'
  | 'submitting'
  | 'polling'
  | 'success'
  | 'failed'
  | 'canceled';

export type UserFacingAnalysisError = {
  code: string;
  title: string;
  message: string;
  retryable: boolean;
};

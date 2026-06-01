export type AnalysisWarningSource = 'summary' | 'criteria' | 'result' | 'error';

export type AnalysisWarningViewModel = {
  code: string;
  message: string;
  relatedFields: string[];
  source: AnalysisWarningSource;
  isKnown: boolean;
};

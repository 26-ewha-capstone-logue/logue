import type { QuestionResultViewModel } from '../_models/analysisViewModels';
import AnalysisCard from './AnalysisCard';
import AnalysisWarningList from './AnalysisWarningList';
import ResultChartPanel from './ResultChartPanel';
import ResultCriteriaSummary from './ResultCriteriaSummary';
import ResultSummaryHeader from './ResultSummaryHeader';

export type VerificationResultProps = {
  result: QuestionResultViewModel;
};

export default function VerificationResult({
  result,
}: VerificationResultProps) {
  return (
    <AnalysisCard className="gap-20">
      <ResultSummaryHeader insight={result.insight} title={result.title} />
      <ResultCriteriaSummary items={result.criteriaItems} />
      <ResultChartPanel chart={result.chart} />
      <AnalysisWarningList warnings={result.warnings} />
    </AnalysisCard>
  );
}

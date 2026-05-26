import AlertIcon from '@/assets/icons/alert.svg';
import type { AnalysisWarningViewModel } from '../_models/analysisWarningTypes';

export type AnalysisWarningListProps = {
  warnings: AnalysisWarningViewModel[];
  titleClassName?: string;
  listClassName?: string;
};

export default function AnalysisWarningList({
  warnings,
  titleClassName = 'text-body2 font-semibold',
  listClassName = 'ml-20 flex list-disc flex-col gap-8 text-body2 text-gray-900',
}: AnalysisWarningListProps) {
  if (warnings.length === 0) return null;

  return (
    <div className="flex flex-col gap-8">
      <div
        className={`inline-flex items-center gap-4 text-orange-500 ${titleClassName}`}
      >
        <AlertIcon aria-hidden className="icon-16 text-orange-500" />
        <span>?곗씠??寃쎄퀬</span>
      </div>
      <ul className={listClassName}>
        {warnings.map((warning) => (
          <li key={`${warning.source}-${warning.code}-${warning.message}`}>
            {warning.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

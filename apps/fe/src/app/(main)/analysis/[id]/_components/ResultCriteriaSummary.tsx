import type { ResultCriteriaItemViewModel } from '@/features/analysis/models/analysisViewModels';

type ResultCriteriaSummaryProps = {
  items: ResultCriteriaItemViewModel[];
};

export default function ResultCriteriaSummary({
  items,
}: ResultCriteriaSummaryProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 text-body2 text-gray-900">
      {items.map(({ label, value }) => (
        <p key={label}>
          <span className="font-semibold">{label}:</span> {value}
        </p>
      ))}
    </div>
  );
}

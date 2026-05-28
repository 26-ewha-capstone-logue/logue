type ResultSummaryHeaderProps = {
  insight: string;
  title: string;
};

export default function ResultSummaryHeader({
  insight,
  title,
}: ResultSummaryHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-body3 font-semibold text-gray-900">{title}</p>
      <p className="text-body2 text-gray-900">{insight}</p>
    </div>
  );
}

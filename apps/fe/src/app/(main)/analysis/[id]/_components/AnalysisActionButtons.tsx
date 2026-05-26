type AnalysisActionButtonsProps = {
  editLabel?: string;
  continueLabel?: string;
  disabled?: boolean;
  onEdit?: () => void;
  onContinue?: () => void;
  className?: string;
};

export default function AnalysisActionButtons({
  editLabel = '수정하기',
  continueLabel = '이 기준으로 계속 할게요',
  disabled = false,
  onEdit,
  onContinue,
  className = '',
}: AnalysisActionButtonsProps) {
  return (
    <div className={`flex justify-end gap-8 ${className}`.trim()}>
      <button
        type="button"
        onClick={onEdit}
        disabled={disabled}
        className="rounded-20 bg-gray-300 px-16 py-8 text-body2 text-gray-700 transition-colors hover:bg-gray-400 disabled:cursor-not-allowed disabled:text-gray-500"
      >
        {editLabel}
      </button>
      <button
        type="button"
        onClick={onContinue}
        disabled={disabled}
        className="rounded-20 bg-orange-500 px-16 py-8 text-body2 text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:text-gray-600"
      >
        {continueLabel}
      </button>
    </div>
  );
}

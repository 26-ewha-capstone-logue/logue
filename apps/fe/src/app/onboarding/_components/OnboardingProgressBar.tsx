export default function OnboardingProgressBar({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div className="flex gap-8">
      {Array.from({ length: total }).map((_, i) => {
        const filled = i < current;
        return (
          <span
            key={i}
            className={`h-4 flex-1 rounded-full transition-colors ${
              filled ? 'bg-orange-500' : 'bg-gray-300'
            }`}
          />
        );
      })}
    </div>
  );
}

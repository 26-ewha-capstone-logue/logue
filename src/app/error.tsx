'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">오류 발생</h1>
      <p className="text-gray-500">{error.message}</p>
      <button
        onClick={reset}
        className="rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-hover"
      >
        다시 시도
      </button>
    </div>
  );
}

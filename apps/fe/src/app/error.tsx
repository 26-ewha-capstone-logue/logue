'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">오류 발생</h1>
      <p className="text-gray-500">
        잠시 후 다시 시도해주세요. 문제가 계속되면 관리자에게 문의해주세요.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
      >
        다시 시도
      </button>
    </div>
  );
}

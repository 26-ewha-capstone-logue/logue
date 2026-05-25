'use client';

import { useRouter } from 'next/navigation';

type DataDetailStatusProps = {
  message: string;
};

export default function DataDetailStatus({ message }: DataDetailStatusProps) {
  const router = useRouter();

  return (
    <main className="scrollbar-hide flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-40 pt-32 pb-40">
      <p className="mb-16 text-body3 text-gray-700">{message}</p>
      <button
        type="button"
        onClick={() => router.push('/data')}
        className="rounded-full bg-orange-500 px-16 py-8 text-body4 font-medium text-white transition-colors hover:bg-orange-600"
      >
        목록으로 돌아가기
      </button>
    </main>
  );
}

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-gray-500">페이지를 찾을 수 없습니다.</p>
      <Link
        href="/"
        className="rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-hover"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}

import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-16">
      <h1 className="text-3xl font-bold">Logue</h1>
      <Link href="/anal" className="text-body2 text-blue-600 underline">
        분석 화면 목록
      </Link>
    </div>
  );
}

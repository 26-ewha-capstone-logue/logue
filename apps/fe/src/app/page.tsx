import Link from 'next/link';

export default function IntroPage() {
  return (
    <main className="flex min-h-screen flex-col bg-black text-white">
      {/* TODO: S-INTR 랜딩 페이지 구현 */}
      {/* 히어로 섹션, 뉴스 캐러셀, CTA 등 */}
      <div className="flex flex-1 flex-col items-center justify-center gap-24">
        <h1 className="text-head1">
          Logue는 당신의 가장 스마트한
          <br />
          AI 데이터 분석 파트너입니다.
        </h1>
        <p className="text-body1 text-gray-500">
          당신의 업무 교류의 파트너를 만드는, Logue.
        </p>
        <Link
          href="/analysis"
          className="rounded-12 bg-orange-500 px-32 py-12 text-body3 text-white transition-colors hover:bg-orange-600"
        >
          Logue 체험하기
        </Link>
      </div>
    </main>
  );
}

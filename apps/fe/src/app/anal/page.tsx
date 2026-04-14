import Link from 'next/link';

const screens = [
  {
    href: '/anal/s-anal-02',
    id: 'S-ANAL-02',
    label: '대화 준비',
    figma:
      'https://www.figma.com/design/DrYv1evkrfwTOvXYgrlkHi/%EB%94%94%EC%9E%90%EC%9D%B8?node-id=63-662&m=dev',
  },
  {
    href: '/anal/p-anal-01',
    id: 'P-ANAL-01',
    label: '분석 패널',
    figma:
      'https://www.figma.com/design/DrYv1evkrfwTOvXYgrlkHi/%EB%94%94%EC%9E%90%EC%9D%B8?node-id=34-1988&m=dev',
  },
  {
    href: '/anal/s-anal-03',
    id: 'S-ANAL-03',
    label: '결과 요약',
    figma:
      'https://www.figma.com/design/DrYv1evkrfwTOvXYgrlkHi/%EB%94%94%EC%9E%90%EC%9D%B8?node-id=201-428&m=dev',
  },
] as const;

export default function AnalIndexPage() {
  return (
    <div className="mx-auto flex min-h-full max-w-[72rem] flex-1 flex-col justify-center px-24 py-40">
      <h1 className="text-head2 text-gray-900">분석 화면 (Figma 동기화용)</h1>
      <p className="mt-8 text-body2 text-gray-600">
        아래 링크는 구현 시 참고한 Figma 노드입니다. 스펙은 Dev Mode 기준으로
        맞춰 주세요.
      </p>
      <ul className="mt-24 flex flex-col gap-16">
        {screens.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href}
              className="flex flex-col rounded-12 border border-gray-300 bg-white p-20 transition-colors hover:border-blue-400 hover:bg-blue-100"
            >
              <span className="text-body3 text-gray-900">
                {s.id} · {s.label}
              </span>
              <span className="mt-4 break-all text-body4 text-blue-600">
                {s.figma}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

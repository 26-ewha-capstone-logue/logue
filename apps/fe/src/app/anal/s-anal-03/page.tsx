/**
 * Figma: https://www.figma.com/design/DrYv1evkrfwTOvXYgrlkHi/%EB%94%94%EC%9E%90%EC%9D%B8?node-id=201-428&m=dev
 * 노드 201:428 — S-ANAL-03 (추정: 분석 결과·인사이트)
 */
import AnalShell from '@/components/layout/AnalShell';

const metrics = [
  { label: '전체 발화', value: '128', hint: '메시지 수' },
  { label: '감정 점수', value: '+0.42', hint: '긍정 쪽으로 치우침' },
  { label: '응답 지연', value: '2.1분', hint: '평균' },
];

const tags = ['요약', '감정', '키워드', '액션 아이템'];

export default function SAnal03Page() {
  return (
    <AnalShell title="결과 요약" screenId="S-ANAL-03">
      <div className="mx-auto max-w-[96rem]">
        <div className="flex flex-wrap items-end justify-between gap-16">
          <div>
            <h1 className="text-head2 text-gray-900">분석 결과</h1>
            <p className="mt-8 text-body1 text-gray-600">
              마지막 분석 기준으로 요약했습니다.
            </p>
          </div>
          <button
            type="button"
            className="rounded-12 border border-gray-400 bg-white px-20 py-12 text-body2 text-gray-800 hover:bg-gray-200"
          >
            보내기
          </button>
        </div>

        <div className="mt-32 grid gap-16 sm:grid-cols-3">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-16 border border-gray-300 bg-white p-24 shadow-sm"
            >
              <p className="text-body2 text-gray-600">{m.label}</p>
              <p className="mt-8 text-head2 text-blue-600">{m.value}</p>
              <p className="mt-8 text-caption text-gray-500">{m.hint}</p>
            </div>
          ))}
        </div>

        <div className="mt-32 rounded-16 border border-gray-300 bg-white p-24">
          <h2 className="text-head4 text-gray-900">하이라이트</h2>
          <div className="mt-16 flex flex-wrap gap-8">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-orange-100 px-16 py-6 text-body4 font-medium text-orange-800"
              >
                {tag}
              </span>
            ))}
          </div>
          <ul className="mt-24 list-disc space-y-12 pl-24 text-body1 text-gray-800">
            <li>핵심 주제는 제품 피드백과 일정 조율로 모였습니다.</li>
            <li>
              부정적 표현은 전체의 약 12%이며, 주로 응답 지연에 대한 언급입니다.
            </li>
            <li>다음 단계로 제안된 액션은 3건입니다.</li>
          </ul>
        </div>
      </div>
    </AnalShell>
  );
}

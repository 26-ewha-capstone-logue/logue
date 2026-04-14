/**
 * Figma: https://www.figma.com/design/DrYv1evkrfwTOvXYgrlkHi/%EB%94%94%EC%9E%90%EC%9D%B8?node-id=34-1988&m=dev
 * 노드 34:1988 — P-ANAL-01 (추정: 좌·우 패널 분석 작업)
 */
import AnalShell from '@/components/layout/AnalShell';

const sampleThreads = [
  { id: '1', title: '고객 응대 #12', updated: '오늘 14:20', tone: '중립' },
  { id: '2', title: '팀 미팅 메모', updated: '어제', tone: '긍정' },
  { id: '3', title: '1:1 피드백', updated: '3일 전', tone: '주의' },
];

export default function PAnal01Page() {
  return (
    <AnalShell title="분석 패널" screenId="P-ANAL-01">
      <div className="grid min-h-[56rem] gap-24 lg:grid-cols-[minmax(0,36rem)_1fr]">
        <aside className="flex flex-col rounded-16 border border-gray-300 bg-white p-20">
          <h2 className="text-head4 text-gray-900">대화 목록</h2>
          <div className="mt-16 flex flex-col gap-8">
            {sampleThreads.map((t) => (
              <button
                key={t.id}
                type="button"
                className="rounded-12 border border-transparent px-16 py-14 text-left hover:border-blue-300 hover:bg-blue-100"
              >
                <span className="text-body2 font-semibold text-gray-900">
                  {t.title}
                </span>
                <div className="mt-4 flex items-center justify-between gap-8">
                  <span className="text-caption text-gray-600">
                    {t.updated}
                  </span>
                  <span className="rounded-8 bg-gray-200 px-8 py-2 text-body4 text-gray-800">
                    {t.tone}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex flex-col rounded-16 border border-gray-300 bg-white p-24">
          <div className="flex flex-wrap items-center justify-between gap-12 border-b border-gray-300 pb-16">
            <h2 className="text-head4 text-gray-900">미리보기</h2>
            <div className="flex gap-8">
              <span className="rounded-8 bg-orange-100 px-12 py-4 text-body4 font-medium text-orange-800">
                분석 중
              </span>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-12 py-20">
            <div className="h-12 animate-pulse rounded-8 bg-gray-300" />
            <div className="h-12 w-[92%] animate-pulse rounded-8 bg-gray-200" />
            <div className="h-12 w-[84%] animate-pulse rounded-8 bg-gray-200" />
            <div className="h-12 w-[66%] animate-pulse rounded-8 bg-gray-200" />
          </div>
          <div className="mt-auto flex flex-wrap gap-12 border-t border-gray-300 pt-20">
            <button
              type="button"
              className="rounded-12 bg-blue-500 px-24 py-12 text-body2 font-semibold text-white hover:bg-blue-600"
            >
              분석 실행
            </button>
            <button
              type="button"
              className="rounded-12 border border-gray-400 px-24 py-12 text-body2 text-gray-800 hover:bg-gray-200"
            >
              필터
            </button>
          </div>
        </section>
      </div>
    </AnalShell>
  );
}

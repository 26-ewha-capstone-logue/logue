/**
 * Figma: https://www.figma.com/design/DrYv1evkrfwTOvXYgrlkHi/%EB%94%94%EC%9E%90%EC%9D%B8?node-id=63-662&m=dev
 * 노드 63:662 — S-ANAL-02 (추정: 대화 업로드·준비)
 */
import AnalShell from '@/components/layout/AnalShell';

export default function SAnal02Page() {
  return (
    <AnalShell title="대화 준비" screenId="S-ANAL-02">
      <div className="mx-auto max-w-[64rem]">
        <h1 className="text-head2 text-gray-900">
          분석할 대화를 준비해 주세요
        </h1>
        <p className="mt-12 text-body1 text-gray-600">
          파일을 업로드하거나 붙여넣기로 대화 내용을 추가할 수 있습니다.
        </p>

        <div className="mt-32 rounded-16 border-2 border-dashed border-gray-400 bg-white p-40 text-center">
          <p className="text-head4 text-gray-800">여기로 파일을 끌어다 놓기</p>
          <p className="mt-8 text-body2 text-gray-600">또는</p>
          <button
            type="button"
            className="mt-16 rounded-12 bg-orange-500 px-28 py-14 text-body2 font-semibold text-white hover:bg-orange-600"
          >
            파일 선택
          </button>
          <p className="mt-16 text-caption text-gray-500">
            .txt, .csv 지원 (예시)
          </p>
        </div>

        <div className="mt-24">
          <label htmlFor="paste-conv" className="text-body3 text-gray-800">
            대화 붙여넣기
          </label>
          <textarea
            id="paste-conv"
            rows={6}
            placeholder="대화 내용을 입력하세요."
            className="mt-8 w-full resize-y rounded-12 border border-gray-400 bg-white px-16 py-12 text-body2 text-gray-900 outline-none ring-blue-500 focus:border-blue-500 focus:ring-2"
          />
        </div>

        <div className="mt-32 flex flex-wrap justify-end gap-12">
          <button
            type="button"
            className="rounded-12 border border-gray-400 bg-white px-24 py-14 text-body2 text-gray-800 hover:bg-gray-200"
          >
            취소
          </button>
          <button
            type="button"
            className="rounded-12 bg-blue-500 px-24 py-14 text-body2 font-semibold text-white hover:bg-blue-600"
          >
            다음
          </button>
        </div>
      </div>
    </AnalShell>
  );
}

export default function AnalysisChatPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="flex flex-1">
      {/* TODO: 데이터 테이블 (좌측) */}
      <section className="flex-1 overflow-auto bg-white">
        <p className="p-24 text-body2 text-gray-600">데이터 테이블 영역</p>
      </section>

      {/* TODO: 채팅 사이드바 (우측) */}
      <aside className="w-[42rem] shrink-0 border-l border-gray-300 bg-white">
        <p className="p-24 text-body2 text-gray-600">채팅 사이드바 영역</p>
      </aside>
    </div>
  );
}

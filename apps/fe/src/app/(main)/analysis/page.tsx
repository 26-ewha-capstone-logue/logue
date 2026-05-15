'use client';

import { useRouter } from 'next/navigation';
import GreetingSection from './_components/GreetingSection';
import PromptInput, { type PromptInputValue } from './_components/PromptInput';
import SampleDataSection from './_components/SampleDataSection';

// TODO: 인증/세션 연동 후 실제 사용자 이름으로 교체
const USER_NAME = '손하늘';

export default function AnalysisPage() {
  const router = useRouter();

  const handleSubmit = (value: PromptInputValue) => {
    // TODO: 분석 생성 API 호출 후 응답 id 로 교체
    // 예: const { id } = await createAnalysis({ prompt: value.prompt, file: value.file });
    const tempId = `tmp-${Date.now()}`;
    const params = new URLSearchParams();
    if (value.prompt) params.set('q', value.prompt);
    if (value.file?.name) params.set('file', value.file.name);
    const qs = params.toString();
    router.push(`/analysis/${tempId}${qs ? `?${qs}` : ''}`);
  };

  return (
    <main className="scrollbar-hide mx-auto flex min-h-0 w-full max-w-[128rem] flex-1 flex-col items-center overflow-y-auto px-40 pt-[8rem] pb-40">
      <div className="mb-40">
        <GreetingSection userName={USER_NAME} />
      </div>

      <PromptInput
        onSubmit={handleSubmit}
        onError={(message) => alert(message)}
      />

      <SampleDataSection />
    </main>
  );
}

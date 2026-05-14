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
    void value;
    const tempId = `tmp-${Date.now()}`;
    router.push(`/analysis/${tempId}`);
  };

  return (
    <main className="mx-auto flex w-full max-w-[128rem] flex-1 flex-col items-center px-40 pt-[8rem] pb-40">
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

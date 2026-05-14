'use client';

import GreetingSection from './_components/GreetingSection';
import PromptInput from './_components/PromptInput';
import SampleDataSection from './_components/SampleDataSection';

// TODO: 인증/세션 연동 후 실제 사용자 이름으로 교체
const USER_NAME = '손하늘';

export default function AnalysisPage() {
  return (
    <main className="mx-auto flex w-full max-w-[128rem] flex-1 flex-col items-center px-40 pt-[8rem] pb-40">
      <div className="mb-40">
        <GreetingSection userName={USER_NAME} />
      </div>

      <PromptInput onError={(message) => alert(message)} />

      <SampleDataSection />
    </main>
  );
}

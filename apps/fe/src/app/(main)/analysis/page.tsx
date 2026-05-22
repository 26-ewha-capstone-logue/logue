'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getMyInfo } from '@/apis/user';
import { useAuthSession } from '@/providers/AuthProvider';
import GreetingSection from './_components/GreetingSection';
import PromptInput, { type PromptInputValue } from './_components/PromptInput';
import SampleDataSection from './_components/SampleDataSection';

const FALLBACK_USER_NAME = '사용자';

export default function AnalysisPage() {
  const router = useRouter();
  const { hasAccessToken } = useAuthSession();
  const { data: myInfo } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: getMyInfo,
    enabled: hasAccessToken,
  });

  const userName = myInfo?.name ?? FALLBACK_USER_NAME;

  const handleSubmit = (value: PromptInputValue) => {
    // TODO: 분석 생성 API 호출 후 응답 id 로 교체
    // e.g. const { id } = await createAnalysis({ prompt: value.prompt, file: value.file });
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
        <GreetingSection userName={userName} />
      </div>

      <PromptInput
        onSubmit={handleSubmit}
        onError={(message) => alert(message)}
      />

      <SampleDataSection />
    </main>
  );
}

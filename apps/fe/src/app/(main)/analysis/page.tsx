'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getMyInfo } from '@/apis/user';
import { useAuthSession } from '@/providers/AuthProvider';
import GreetingSection from './_components/GreetingSection';
import PromptInput, { type PromptInputValue } from './_components/PromptInput';
import SampleDataSection from './_components/SampleDataSection';

const FALLBACK_USER_NAME = '사용자';
const USER_INFO_STALE_TIME = 5 * 60 * 1000;

export default function AnalysisPage() {
  const router = useRouter();
  const { hasAccessToken } = useAuthSession();
  const {
    data: myInfo,
    isError: isUserInfoError,
    isLoading: isUserInfoLoading,
  } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: getMyInfo,
    enabled: hasAccessToken,
    staleTime: USER_INFO_STALE_TIME,
  });

  const shouldShowUserInfoLoading = hasAccessToken && isUserInfoLoading;
  const shouldShowUserInfoError = hasAccessToken && isUserInfoError;
  const shouldUseFetchedUserName =
    hasAccessToken && !isUserInfoLoading && !isUserInfoError;
  const userName = shouldUseFetchedUserName
    ? (myInfo?.name ?? FALLBACK_USER_NAME)
    : FALLBACK_USER_NAME;

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

  const handlePromptError = (message: string) => {
    // TODO: Replace alert with toast/snackbar when shared feedback UI is ready.
    alert(message);
  };

  return (
    <main className="scrollbar-hide mx-auto flex min-h-0 w-full max-w-[128rem] flex-1 flex-col items-center overflow-y-auto px-40 pt-[8rem] pb-40">
      <div className="mb-40">
        <GreetingSection userName={userName} />
        {shouldShowUserInfoLoading && (
          <p className="mt-12 text-center text-body4 text-gray-500">
            사용자 정보를 불러오는 중입니다.
          </p>
        )}
        {shouldShowUserInfoError && (
          <p
            role="alert"
            className="mt-12 text-center text-body4 text-error-500"
          >
            사용자 정보를 불러오지 못했어요.
          </p>
        )}
      </div>

      <PromptInput onSubmit={handleSubmit} onError={handlePromptError} />

      <SampleDataSection />
    </main>
  );
}

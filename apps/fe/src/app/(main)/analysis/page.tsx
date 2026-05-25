'use client';

import { ToastPortal } from '@/components';
import { useMyInfo } from '@/hooks/useMyInfo';
import { useStartAnalysis } from '@/hooks/useStartAnalysis';
import { useToast } from '@/hooks/useToast';
import { validateCsvFile } from '@/lib/fileValidation';
import { useAuthSession } from '@/providers/AuthProvider';
import GreetingSection from './_components/GreetingSection';
import PromptInput, { type PromptInputValue } from './_components/PromptInput';
import SampleDataSection from './_components/SampleDataSection';

const FALLBACK_USER_NAME = '사용자';
const MISSING_FILE_MESSAGE = '분석할 CSV 파일을 먼저 추가해 주세요.';
const LOGIN_REQUIRED_MESSAGE = '로그인이 필요해요. 다시 로그인해 주세요.';
const START_ANALYSIS_ERROR_MESSAGE =
  '분석을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.';

const ANALYSIS_FILE_MESSAGES = {
  invalidType: 'Logue는 CSV 형식의 파일만 지원해요',
  tooLarge: '파일이 너무 커요. 50MB까지만 업로드 가능해요',
  empty: '빈 CSV 파일은 업로드할 수 없어요',
};

export default function AnalysisPage() {
  const { hasAccessToken } = useAuthSession();
  const { toast, showToast } = useToast();
  const {
    data: myInfo,
    isError: isUserInfoError,
    isLoading: isUserInfoLoading,
  } = useMyInfo(hasAccessToken);
  const startAnalysis = useStartAnalysis({
    loginRequiredMessage: LOGIN_REQUIRED_MESSAGE,
    fallbackErrorMessage: START_ANALYSIS_ERROR_MESSAGE,
    onError: showToast,
  });

  const shouldShowUserInfoLoading = hasAccessToken && isUserInfoLoading;
  const shouldShowUserInfoError = hasAccessToken && isUserInfoError;
  const shouldUseFetchedUserName =
    hasAccessToken && !isUserInfoLoading && !isUserInfoError;
  const userName = shouldUseFetchedUserName
    ? (myInfo?.name ?? FALLBACK_USER_NAME)
    : FALLBACK_USER_NAME;
  const handleSubmit = (value: PromptInputValue) => {
    if (!value.file) {
      showToast(MISSING_FILE_MESSAGE);
      return;
    }

    startAnalysis.startAnalysis({
      type: 'file',
      file: value.file,
      prompt: value.prompt,
    });
  };

  const handlePromptError = (message: string) => {
    showToast(message);
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

      <PromptInput
        validateFile={(file) => validateCsvFile(file, ANALYSIS_FILE_MESSAGES)}
        submitDisabled={startAnalysis.isPending}
        onSubmit={handleSubmit}
        onError={handlePromptError}
      />

      <SampleDataSection />

      <ToastPortal toast={toast} />
    </main>
  );
}

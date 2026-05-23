'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { createAnalysisFlow, createConversation } from '@/apis/analysis';
import { uploadDataSource } from '@/apis/dataSource';
import { getApiErrorMessage } from '@/apis/errors';
import { getMyInfo } from '@/apis/user';
import { ToastAlert } from '@/components';
import { validateCsvFile } from '@/lib/fileValidation';
import { useAuthSession } from '@/providers/AuthProvider';
import GreetingSection from './_components/GreetingSection';
import PromptInput, { type PromptInputValue } from './_components/PromptInput';
import SampleDataSection from './_components/SampleDataSection';

const FALLBACK_USER_NAME = '사용자';
const USER_INFO_STALE_TIME = 5 * 60 * 1000;
const TOAST_DURATION_MS = 2500;
const MISSING_FILE_MESSAGE = '분석할 CSV 파일을 먼저 추가해 주세요.';
const LOGIN_REQUIRED_MESSAGE = '로그인이 필요해요. 다시 로그인해 주세요.';
const START_ANALYSIS_ERROR_MESSAGE =
  '분석을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.';

const ANALYSIS_FILE_MESSAGES = {
  invalidType: 'Logue는 CSV 형식의 파일만 지원해요',
  tooLarge: '파일이 너무 커요. 50MB까지만 업로드 가능해요',
};

export default function AnalysisPage() {
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
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
  const startAnalysisMutation = useMutation({
    mutationFn: async (value: PromptInputValue) => {
      if (!hasAccessToken) {
        throw new Error(LOGIN_REQUIRED_MESSAGE);
      }

      if (!value.file) {
        throw new Error(MISSING_FILE_MESSAGE);
      }

      const uploadedDataSource = await uploadDataSource(value.file);
      const conversation = await createConversation();
      const analysisFlow = await createAnalysisFlow(
        conversation.conversationId,
        {
          dataSourceId: uploadedDataSource.dataSourceId,
        },
      );

      return {
        conversationId: conversation.conversationId,
        analysisFlowId: analysisFlow.analysisFlowId,
        dataSourceId: uploadedDataSource.dataSourceId,
        prompt: value.prompt,
        fileName: value.file.name,
      };
    },
    onSuccess: ({
      conversationId,
      analysisFlowId,
      dataSourceId,
      prompt,
      fileName,
    }) => {
      const params = new URLSearchParams({
        analysisFlowId: String(analysisFlowId),
        dataSourceId: String(dataSourceId),
        q: prompt,
        file: fileName,
      });

      router.push(`/analysis/${conversationId}?${params.toString()}`);
    },
    onError: (error) => {
      setToastMessage(getApiErrorMessage(error, START_ANALYSIS_ERROR_MESSAGE));
    },
  });

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(
      () => setToastMessage(null),
      TOAST_DURATION_MS,
    );
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const handleSubmit = (value: PromptInputValue) => {
    startAnalysisMutation.mutate(value);
  };

  const handlePromptError = (message: string) => {
    setToastMessage(message);
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
        submitDisabled={startAnalysisMutation.isPending}
        onSubmit={handleSubmit}
        onError={handlePromptError}
      />

      <SampleDataSection />

      {toastMessage && (
        <div className="pointer-events-none fixed bottom-[4.4rem] left-1/2 z-[60] -translate-x-1/2">
          <ToastAlert role="alert">{toastMessage}</ToastAlert>
        </div>
      )}
    </main>
  );
}

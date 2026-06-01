'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { startAnalysisFlowFromDataSource } from '@/apis/analysis';
import { getApiErrorMessage } from '@/apis/errors';
import { dataSourceKeys, uploadDataSource } from '@/features/dataSource';
import { writeAnalysisStartPayload } from '@/lib/analysisStartPayload';
import { useAuthSession } from '@/providers/AuthProvider';

const AUTH_INITIALIZING_MESSAGE =
  '인증 상태를 확인하고 있어요. 잠시 후 다시 시도해 주세요.';

export type StartAnalysisInput =
  | {
      type: 'file';
      file: File;
      prompt?: string | null;
    }
  | {
      type: 'dataSource';
      dataSourceId: number;
      fileName?: string | null;
      prompt?: string | null;
    };

type UseStartAnalysisOptions = {
  loginRequiredMessage: string;
  fallbackErrorMessage: string;
  onError?: (message: string) => void;
};

export function useStartAnalysis({
  loginRequiredMessage,
  fallbackErrorMessage,
  onError,
}: UseStartAnalysisOptions) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasAccessToken, status } = useAuthSession();

  const mutation = useMutation({
    mutationFn: async (input: StartAnalysisInput) => {
      if (status === 'initializing') {
        throw new Error(AUTH_INITIALIZING_MESSAGE);
      }

      if (!hasAccessToken) {
        throw new Error(loginRequiredMessage);
      }

      const dataSourceId =
        input.type === 'file'
          ? (await uploadDataSource(input.file)).dataSourceId
          : input.dataSourceId;

      if (input.type === 'file') {
        await queryClient.invalidateQueries({
          queryKey: dataSourceKeys.lists(),
        });
      }

      const analysisFlow = await startAnalysisFlowFromDataSource(dataSourceId);

      return {
        conversationId: analysisFlow.conversationId,
        analysisFlowId: analysisFlow.analysisFlowId,
        dataSourceId: analysisFlow.dataSourceId,
        prompt: input.prompt,
        fileName: input.type === 'file' ? input.file.name : input.fileName,
      };
    },
    onSuccess: ({
      conversationId,
      analysisFlowId,
      dataSourceId,
      prompt,
      fileName,
    }) => {
      writeAnalysisStartPayload(conversationId, { prompt, fileName });

      const params = new URLSearchParams({
        analysisFlowId: String(analysisFlowId),
        dataSourceId: String(dataSourceId),
      });

      router.push(`/analysis/${conversationId}?${params.toString()}`);
    },
    onError: (error) => {
      onError?.(getApiErrorMessage(error, fallbackErrorMessage));
    },
  });

  const pendingDataSourceId =
    mutation.isPending && mutation.variables?.type === 'dataSource'
      ? mutation.variables.dataSourceId
      : null;

  return {
    startAnalysis: mutation.mutate,
    startAnalysisAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    pendingDataSourceId,
  };
}
